import snmp from "net-snmp";

const session = snmp.createSession(
    "192.168.28.146", // change IP here
    "public",
    {
        version: snmp.Version2c,
        timeout: 5000,
        retries: 1
    }
);

// Standard Printer MIB
const PRINTER_MIB = "1.3.6.1.2.1.43";

// Vendor-specific (VERY important for Brother/Canon)
const PRIVATE_MIB = "1.3.6.1.4.1";

function walk(oid, label) {
    return new Promise((resolve) => {
        const results = [];

        console.log(`\n--- Walking ${label}: ${oid} ---\n`);

        session.subtree(
            oid,
            (varbinds) => {
                for (const vb of varbinds) {
                    const value =
                        Buffer.isBuffer(vb.value)
                            ? vb.value.toString("utf8")
                            : vb.value;

                    results.push({ oid: vb.oid, value });

                    console.log(`${vb.oid} = ${value}`);
                }
            },
            (error) => {
                if (error) {
                    console.log(`Error on ${label}:`, error.message);
                }

                console.log(`\nFinished ${label}`);
                console.log(`Found ${results.length} entries`);

                resolve(results);
            }
        );
    });
}

async function run() {
    try {
        const printerData = await walk(PRINTER_MIB, "Printer MIB (1.3.6.1.2.1.43)");

        // If Printer MIB is empty or weak → try vendor tree
        if (printerData.length < 5) {
            console.log("\n⚠️ Printer-MIB is limited. Trying Vendor MIB...\n");
            await walk(PRIVATE_MIB, "Vendor MIB (1.3.6.1.4.1)");
        }

    } catch (err) {
        console.error("Fatal error:", err);
    } finally {
        session.close();
    }
}

run();