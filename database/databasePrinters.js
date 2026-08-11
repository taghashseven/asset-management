import snmp from "net-snmp";
import db from "../database/db.js";

const COMMUNITY = "public";

const OIDS = {
    hostname: "1.3.6.1.2.1.1.5.0",               // sysName
    model: "1.3.6.1.2.1.1.1.0",                  // sysDescr
    pagesPrinted: "1.3.6.1.2.1.43.10.2.1.4.1.1", // prtMarkerLifeCount
    tonerNames: "1.3.6.1.2.1.43.11.1.1.6",       // prtMarkerSuppliesDescription
    tonerMaxCapacity: "1.3.6.1.2.1.43.11.1.1.8", 
    tonerCurrentLevel: "1.3.6.1.2.1.43.11.1.1.9"
};

function extractColorFromName(name = "") {
    const lower = name.toLowerCase();
    if (lower.includes("cyan")) return "Cyan";
    if (lower.includes("magenta")) return "Magenta";
    if (lower.includes("yellow")) return "Yellow";
    if (lower.includes("black")) return "Black";
    return "Black";
}

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

function walkOid(session, oid, supplyTable, columnKey) {
    return new Promise((resolve) => {
        session.subtree(oid, (varbinds) => {
            for (let vb of varbinds) {
                if (!snmp.isVarbindError(vb)) {
                    const oidStr = Array.isArray(vb.oid) ? vb.oid.join('.') : vb.oid.toString();
                    const index = oidStr.startsWith(oid) ? oidStr.slice(oid.length) : oidStr;
                    
                    if (!supplyTable[index]) supplyTable[index] = {};
                    
                    let val = vb.value;
                    if (Buffer.isBuffer(val)) val = val.toString('utf-8');
                    
                    supplyTable[index][columnKey] = val;
                }
            }
        }, () => resolve());
    });
}

// ============================================================================
// AUTOMATED TONER DETECTION LOGIC
// ============================================================================

export async function processTonerDetection(printerId, supplies, currentPageCount) {
    if (!printerId || !supplies || !Array.isArray(supplies) || supplies.length === 0) return;

    for (const supply of supplies) {
        const tonerCode = supply.name; // Unique supply name string (e.g. "Black Cartridge HP CF226A")
        const currentLevel = supply.level;

        try {
            // Fetch the absolute LAST entry recorded for this specific printer and supply slot
            const lastEntry = await db.get(
                `SELECT * FROM printer_toners 
                 WHERE printer_id = ? AND toner_code = ? 
                 ORDER BY id DESC LIMIT 1`,
                [printerId, tonerCode]
            );

            // CASE 1: No previous record exists OR the new level is GREATER than the last level (Refill/Replacement)
            if (!lastEntry || currentLevel > lastEntry.toner_level) {
                
                // 1. Insert a new row marking the start of a new cartridge
                await db.run(
                    `INSERT INTO printer_toners (printer_id, toner_code, toner_level, initial_page, current_page) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [printerId, tonerCode, currentLevel, currentPageCount, currentPageCount]
                );

                // 2. Log event to printer logs table
                await createPrinterLog(printerId, {
                    event_type: 'TONER_REPLACEMENT',
                    toner_name: tonerCode,
                    color: extractColorFromName(tonerCode),
                    description: `New toner registered (${tonerCode}) at page count ${currentPageCount}.`
                });

            } else {
                // CASE 2: Level is lower or equal (Normal depletion) -> Update current record
                await db.run(
                    `UPDATE printer_toners 
                     SET toner_level = ?, current_page = ? 
                     WHERE id = ?`,
                    [currentLevel, currentPageCount, lastEntry.id]
                );
            }
        } catch (error) {
            console.error(`[Toner Detection Error] Printer ID ${printerId}:`, error.message);
        }
    }
}

// ============================================================================
// SNMP SCANNER
// ============================================================================

async function scanPrinter(printer) {
    const printerName = printer?.printer_name || "Unknown Printer";
    const ipAddress = printer?.ip_address || null;
    const fallbackId = printer?.printer_id || ipAddress || null;

    if (!ipAddress) {
        return {
            ip: null,
            listName: printerName,
            displayName: printerName,
            status: "Offline",
            printer_id: fallbackId,
            pagesPrinted: null,
            error: "No IP address configured"
        };
    }

    const session = snmp.createSession(ipAddress, COMMUNITY, {
        timeout: 2000,
        retries: 1
    });

    const supplyTable = {};

    try {
        const model = await getOid(session, OIDS.model);

        if (!model) {
            return {
                ip: ipAddress,
                listName: printerName,
                displayName: printerName,
                status: "Offline",
                printer_id: fallbackId,
                pagesPrinted: null,
                error: "Device did not respond to SNMP walk queries."
            };
        }

        const [hostname, rawPagesPrinted] = await Promise.all([
            getOid(session, OIDS.hostname),
            getOid(session, OIDS.pagesPrinted),
            walkOid(session, OIDS.tonerNames, supplyTable, "name"),
            walkOid(session, OIDS.tonerMaxCapacity, supplyTable, "max"),
            walkOid(session, OIDS.tonerCurrentLevel, supplyTable, "current")
        ]);

        const parsedSupplies = [];

        for (const index in supplyTable) {
            const item = supplyTable[index];
            if (!item.name || item.max === undefined || item.current === undefined) continue;

            const max = Number(item.max);
            const current = Number(item.current);

            let percent = 0;
            if (max > 0 && current >= 0) {
                percent = Math.round((current / max) * 100);
            } else if (current === -3) {
                percent = 100; // Special status code for SNMP OK/Full
            } else if (current === -2) {
                percent = 10;  // Special status code for SNMP Low
            }

            parsedSupplies.push({
                name: String(item.name).trim(),
                level: current,
                max: max,
                percent: percent
            });
        }

        const parsedPages = parseInt(rawPagesPrinted, 10);
        const pagesPrinted = !isNaN(parsedPages) && parsedPages >= 0 ? parsedPages : (printer.page_count ?? null);

        return {
            ip: ipAddress,
            listName: printerName,
            displayName: printerName,
            status: "Online",
            printer_id: fallbackId,
            hostname: hostname ? String(hostname).trim() : "Unknown",
            model: String(model).replace(/[\r\n]+/g, ' ').trim(),
            pagesPrinted: pagesPrinted,
            toner: parsedSupplies,
            supplies: parsedSupplies
        };

    } catch (error) {
        return {
            ip: ipAddress,
            listName: printerName,
            displayName: printerName,
            status: "Offline",
            printer_id: fallbackId,
            pagesPrinted: null,
            error: "Device did not respond to SNMP walk queries."
        };
    } finally {
        session.close();
    }
}

// Fetch database printers, execute active network scan, process metrics & return list
export async function getAllPrinters() {
    try {
        const dbPrinters = await db.all(`SELECT * FROM printers WHERE status != 'Retired'`);

        if (!dbPrinters || dbPrinters.length === 0) {
            return [];
        }

        const scanPromises = dbPrinters.map(printer => scanPrinter(printer));
        const scanResults = await Promise.all(scanPromises);

        const enrichedResults = await Promise.all(
            scanResults.map(async (scanned) => {
                if (scanned.status !== "Online") {
                    return { ...scanned, toner: scanned.toner || [] };
                }

                const targetPrinter = dbPrinters.find(
                    p => p.printer_id === scanned.printer_id || p.ip_address === scanned.ip
                );

                if (!targetPrinter) return scanned;

                // 1. Sync Page Counter when new prints occur
                if (scanned.pagesPrinted !== null && scanned.pagesPrinted > targetPrinter.page_count) {
                    await updatePrinterPageCount(targetPrinter.printer_id, scanned.pagesPrinted);
                }

                const currentPages = scanned.pagesPrinted !== null ? scanned.pagesPrinted : targetPrinter.page_count;

                // 2. Process automated toner detection
                await processTonerDetection(targetPrinter.printer_id, scanned.supplies, currentPages);

                // 3. Fetch active toner tracking records from database
                const dbToners = await db.all(
                    `SELECT toner_code, created_at, initial_page , current_page
                     FROM printer_toners
                     WHERE printer_id = ? `,
                    [targetPrinter.printer_id]
                );

                // 4. Enrich toner list with installation date and pages printed with that toner
                const enrichedToner = (scanned.toner || []).map(t => {
                    const matchedDbToner = dbToners.find(dbT => dbT.toner_code === t.name);

                    const installDate = matchedDbToner ? matchedDbToner.created_at : null;
                    const startPages =  matchedDbToner.initial_page  

                    const pagesPrintedWithToner =   matchedDbToner ? ( matchedDbToner.current_page  -  matchedDbToner.initial_page    ): null

                    return {
                        ...t,
                        installDate: installDate,
                        installedAtPage: startPages,
                        pagesPrintedWithToner: pagesPrintedWithToner
                    };
                });

                return {
                    ...scanned,
                    toner: enrichedToner
                };
            })
        );

        return enrichedResults;
    } catch (error) {
        console.error(`[getAllPrinters Error]:`, error.message);
        throw error;
    }
}


// ============================================================================
// DATABASE CRUD & LOGIC
// ============================================================================

export async function updatePrinterPageCount(printerId, newPageCount) {
    try {
        if (!printerId || newPageCount === undefined || isNaN(newPageCount) || newPageCount < 0) {
            throw new Error("Invalid parameters provided for page count update.");
        }

        const result = await db.run(
            `UPDATE printers SET page_count = ? WHERE printer_id = ?`,
            [Number(newPageCount), printerId]
        );
        return { success: true, updated: result.changes > 0, page_count: newPageCount };
    } catch (error) {
        console.error(`[DB Error] updatePrinterPageCount (Printer ID: ${printerId}):`, error.message);
        return { success: false, error: error.message };
    }
}

export async function createPrinterLog(printerId, logData = {}) {
    try {
        const { event_type, toner_name, color, description } = logData;

        if (!printerId || !event_type) {
            throw new Error("printer_id and event_type are required.");
        }

        if (event_type === 'TONER_REPLACEMENT' && (!toner_name || !toner_name.trim())) {
            throw new Error('toner_name cannot be null or empty for TONER_REPLACEMENT events.');
        }

        const result = await db.run(
            `INSERT INTO printer_log (printer_id, event_type, toner_name, color, description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                printerId, 
                event_type, 
                toner_name ? toner_name.trim() : null, 
                color ?? 'Black', 
                description ?? null
            ]
        );

        return { success: true, log_id: result.lastID };
    } catch (error) {
        console.error(`[DB Error] createPrinterLog (Printer ID: ${printerId}):`, error.message);
        return { success: false, error: error.message };
    }
}

export async function getPrinterById(printerId) {
    try {
        if (!printerId) throw new Error("Printer ID is required.");
        return await db.get(`SELECT * FROM printers WHERE printer_id = ?`, [printerId]);
    } catch (error) {
        console.error(`[DB Error] getPrinterById (Printer ID: ${printerId}):`, error.message);
        return null;
    }
}

export async function upsertPrinter(printer = {}) {
    try {
        const { 
            printer_id, 
            asset_tag, 
            printer_name, 
            brand, 
            model, 
            serial_number, 
            ip_address, 
            mac_address, 
            status, 
            is_color, 
            page_count, 
            location 
        } = printer;

        if (!printer_name || !printer_name.trim()) {
            throw new Error("Printer name is required.");
        }

        const cleanStr = (val) => (val !== undefined && val !== null && String(val).trim() !== "" ? String(val).trim() : null);
        const cleanInt = (val, fallback = 0) => {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? fallback : parsed;
        };

        if (printer_id) {
            const params = [
                cleanStr(asset_tag),
                cleanStr(printer_name),
                cleanStr(brand),
                cleanStr(model),
                cleanStr(serial_number),
                cleanStr(ip_address),
                cleanStr(mac_address),
                cleanStr(status) || 'Active',
                cleanInt(is_color, 0),
                cleanInt(page_count, 0),
                cleanStr(location),
                printer_id
            ];

            const result = await db.run(
                `UPDATE printers SET 
                 asset_tag = ?, 
                 printer_name = ?, 
                 brand = ?, 
                 model = ?, 
                 serial_number = ?, 
                 ip_address = ?, 
                 mac_address = ?, 
                 status = ?, 
                 is_color = ?, 
                 page_count = ?, 
                 location = ?
                 WHERE printer_id = ?`,
                params
            );
            return { success: true, updated: result.changes > 0, printer_id };

        } else {
            const params = [
                cleanStr(asset_tag),
                cleanStr(printer_name),
                cleanStr(brand),
                cleanStr(model),
                cleanStr(serial_number),
                cleanStr(ip_address),
                cleanStr(mac_address),
                cleanStr(status) || 'Active',
                cleanInt(is_color, 0),
                cleanInt(page_count, 0),
                cleanStr(location)
            ];

            const result = await db.run(
                `INSERT INTO printers (asset_tag, printer_name, brand, model, serial_number, ip_address, mac_address, status, is_color, page_count, location)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params
            );
            return { success: true, inserted: true, printer_id: result.lastID };
        }
    } catch (error) {
        console.error(`[DB Error] upsertPrinter:`, error.message);
        return { success: false, error: error.message };
    }
}

export async function deletePrinter(printerId) {
    try {
        if (!printerId) throw new Error("Printer ID is required.");
        const result = await db.run(`DELETE FROM printers WHERE printer_id = ?`, [printerId]);
        return { success: true, deleted: result.changes > 0 };
    } catch (error) {
        console.error(`[DB Error] deletePrinter (Printer ID: ${printerId}):`, error.message);
        return { success: false, error: error.message };
    }
}

export async function getPrinterLogs(printerId) {
    try {
        if (!printerId) throw new Error("Printer ID is required.");
        return await db.all(`SELECT * FROM printer_log WHERE printer_id = ? ORDER BY created_at DESC`, [printerId]);
    } catch (error) {
        console.error(`[DB Error] getPrinterLogs (Printer ID: ${printerId}):`, error.message);
        return [];
    }
}

export async function getPrinterTonerStats(printerId) {
    try {
        if (!printerId) throw new Error("Printer ID is required.");
        return await db.all(
            `SELECT * FROM printer_toners WHERE printer_id = ? ORDER BY id DESC`,
            [printerId]
        );
    } catch (error) {
        console.error(`[DB Error] getPrinterTonerStats (Printer ID: ${printerId}):`, error.message);
        return [];
    }
}