import fs from "fs";
import csv from "csv-parser";
import { upsertComputerAsset } from "../computerAsset.js";

/**
 * Parse MAC addresses into structured format
 */
function parseMacAddresses(macString = "") {
  const eth = macString.match(/Ethernet:\s*([0-9A-Fa-f:-]+)/i)?.[1] || null;
  const wifi = macString.match(/Wi-Fi:\s*([0-9A-Fa-f:-]+)/i)?.[1] || null;

  return { eth, wifi };
}


/**
 * Main import function
 */
export async function importComputerAssetsCSV(filePath) {
  const rows = [];

  // 1. Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Found ${rows.length} assets`);

  // 2. Import loop
  for (const row of rows) {
    try {
      const macs = parseMacAddresses(row.MACAddress);

      const asset = {
        asset_number: null,
        serial_number: row.ComputerSerial?.trim(),
        device_type: "Desktop",
        brand: row.Manufacturer || null,
        model: row.Model || null,
        eth_mac_addr: macs.eth,
        wifi_mac_addr: macs.wifi,
        purchase_date: null,
        status: "Available",
        specs: row.Description , 
        bitlocker_key: row.RecoveryKey || null,
       
      };

      if (!asset.serial_number) {
        console.log("Skipping row (missing serial):", row.Hostname);
        continue;
      }

      await upsertComputerAsset(asset);

      console.log(`Imported: ${asset.serial_number}`);
    } catch (err) {
      console.log("Failed row:", row.Hostname, err.message);
    }
  }

  console.log("Import complete");
}

importComputerAssetsCSV("./database/migrate/assets.csv");