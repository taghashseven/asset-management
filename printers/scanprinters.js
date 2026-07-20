import snmp from "net-snmp";
import  db  from "../database/db.js";

const PRINTERS = [
    { ip: "192.168.28.68",  name: "AMA-Office" },
    { ip: "192.168.28.146", name: "Brothers" },
    { ip: "192.168.28.142", name: "driver trainer" },
    { ip: "192.168.28.60",  name: "Claudine" },
    { ip: "192.168.28.66",  name: "Opperations" },
    { ip: "192.168.28.39",  name: "Dell-GRV" },
    { ip: "192.168.28.118", name: "Purchasing" },
    { ip: "192.168.28.70",  name: "Accounts" },
    { ip: "192.168.28.102", name: "Shepherd's" },
    { ip: "192.168.28.89",  name: "Stores" },
    { ip: "192.168.28.62",  name: "Hr Printer" }
];

const COMMUNITY = "public";

// Extended standard OIDs for System info, Printer MIBs, and Page Counters
const OIDS = {
    hostname: "1.3.6.1.2.1.1.5.0",               // sysName
    model: "1.3.6.1.2.1.1.1.0",                  // sysDescr
    pagesPrinted: "1.3.6.1.2.1.43.10.2.1.4.1.1", // prtMarkerLifeCount.1.1 (Total Engine Pages)
    tonerNames: "1.3.6.1.2.1.43.11.1.1.6",       // prtMarkerSuppliesDescription
    tonerMaxCapacity: "1.3.6.1.2.1.43.11.1.1.8",   // prtMarkerSuppliesMaxCapacity
    tonerCurrentLevel: "1.3.6.1.2.1.43.11.1.1.9",  // prtMarkerSuppliesLevel
};

// Helper function to extract a single OID value (for Hostname, Model, Page Count)
function getOid(session, oid) {
    return new Promise((resolve) => {
        session.get([oid], (err, varbinds) => {
            if (err || !varbinds || varbinds.length === 0 || snmp.isVarbindError(varbinds[0])) {
                resolve(null);
            } else {
                let val = varbinds[0].value;
                if (Buffer.isBuffer(val)) val = val.toString('utf-8');
                resolve(val);
            }
        });
    });
}

// Walk function tailored for structural printer tables
function walkOid(session, oid, supplyTable, columnKey) {
    return new Promise((resolve) => {
        session.subtree(oid, (varbinds) => {
            for (let vb of varbinds) {
                if (!snmp.isVarbindError(vb)) {
                    const index = vb.oid.toString().slice(oid.length);
                    if (!supplyTable[index]) supplyTable[index] = {};
                    
                    let val = vb.value;
                    if (Buffer.isBuffer(val)) val = val.toString('utf-8');
                    
                    supplyTable[index][columnKey] = val;
                }
            }
        }, (err) => {
            // Quietly resolve on error to keep processing moving
            resolve();
        });
    });
}

// Scans a single printer and transforms it into your targeted JSON structure
async function scanPrinter(printer) {
    // Configure session with a quick 2-second timeout so offline printers don't stall execution
    const session = snmp.createSession(printer.ip, COMMUNITY, {
        timeout: 2000,
        retries: 1
    });

    const supplyTable = {};

    try {
        // Attempt to fetch the printer's baseline model description first
        const model = await getOid(session, OIDS.model);

        // If the device does not respond to our baseline GET request, treat it as Offline
        if (!model) {
            session.close();
            return {
                ip: printer.ip,
                listName: printer.name,
                displayName: printer.name,
                status: "Offline",
                printer_id: printer.ip,
                pagesPrinted: null,
                error: "Device did not respond to SNMP walk queries."
            };
        }

        // Fetch hostname, page count, and walk supply entries concurrently
        const [hostname, pagesPrinted] = await Promise.all([
            getOid(session, OIDS.hostname),
            getOid(session, OIDS.pagesPrinted),
            walkOid(session, OIDS.tonerNames, supplyTable, "name"),
            walkOid(session, OIDS.tonerMaxCapacity, supplyTable, "max"),
            walkOid(session, OIDS.tonerCurrentLevel, supplyTable, "current")
        ]);

        session.close();

        const itemsList = [];

        // Parse through walked supply sub-trees
        for (const index in supplyTable) {
            const item = supplyTable[index];
            if (!item.name || item.max === undefined || item.current === undefined) continue;

            let percent = 0;
            if (item.max > 0 && item.current >= 0) {
                percent = Math.round((item.current / item.max) * 100);
            } else if (item.current === -3) {
                percent = 100; // Normal/OK status fallback
            } else if (item.current === -2) {
                percent = 10;  // Low/Warning status fallback
            }

            itemsList.push({
                name: item.name,
                level: item.current,
                max: item.max,
                percent: percent
            });
        }

        const baseResult = {
            ip: printer.ip,
            listName: printer.name,
            displayName: printer.name,
            status: "Online",
            printer_id: printer.ip,
            hostname: hostname || "Unknown",
            model: model.replace(/[\r\n]+/g, ' ').trim(), // Clean whitespace/newlines
            pagesPrinted: pagesPrinted !== null ? Number(pagesPrinted) : "Unknown",
            toner: itemsList,
            supplies: itemsList
        };

        // If no metrics were gathered from the tables, add the diagnostic message
        if (itemsList.length === 0) {
            baseResult.message = "No toner data found";
        }

        return baseResult;

    } catch (error) {
        session.close();
        return {
            ip: printer.ip,
            listName: printer.name,
            displayName: printer.name,
            status: "Offline",
            printer_id: printer.ip,
            pagesPrinted: null,
            error: "Device did not respond to SNMP walk queries."
        };
    }
}

export async function getPrinterData() {

    console.log("Starting network printer matrix scan...");
    
    // Process all printers concurrently 
    const scanPromises = PRINTERS.map(printer => scanPrinter(printer));
    const results = await Promise.all(scanPromises);

    //update the count page from each printer in the database based by ip address
    for (const printer of results) {
        if (printer.status === "Online" && printer.pagesPrinted !== null) {
            try {
                await db.run("UPDATE printers SET page_count = ? WHERE ip_address = ?", [printer.pagesPrinted, printer.ip]);
            }
            catch (error) {
                console.error(`Error updating page count for printer ${printer.ip}:`, error);
            }
        }
    }

    
    return results;
}