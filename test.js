import snmp from "net-snmp";

const PRINTER_IP = "192.168.28.70";
const COMMUNITY = "public";

// Create SNMP session
const session = snmp.createSession(PRINTER_IP, COMMUNITY, {
    timeout: 3000,
    retries: 1
});

// Standard printer OIDs
const OIDS = {
    printerName: "1.3.6.1.2.1.25.3.2.1.3.1",
    printerStatus: "1.3.6.1.2.1.25.3.5.1.1.1",
    errorState: "1.3.6.1.2.1.25.3.5.1.2.1"
};

function snmpGet(label, oid) {
    return new Promise((resolve) => {
        session.get([oid], (err, varbinds) => {
            if (err) {
                resolve({
                    label,
                    status: "FAILED",
                    value: err.message
                });
                return;
            }

            resolve({
                label,
                status: "OK",
                value: varbinds[0].value.toString()
            });
        });
    });
}

async function run() {
    console.log("===================================");
    console.log(" SNMP Printer Diagnostics (ESM)");
    console.log(" IP:", PRINTER_IP);
    console.log("===================================\n");

    for (const [label, oid] of Object.entries(OIDS)) {
        const result = await snmpGet(label, oid);

        console.log("-----");
        console.log(label);
        console.log("Status:", result.status);
        console.log("Value:", result.value);
    }

    session.close();

    console.log("\n===================================");
    console.log("DONE");
    console.log("===================================");
}

run();