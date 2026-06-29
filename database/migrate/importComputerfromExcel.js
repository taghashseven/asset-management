import fs from "fs";
import xlsx from "xlsx";
import { upsertComputerAsset } from "../computerAsset.js";

console.log("Starting import from Excel...");

/**
 * Clean helper
 */
function clean(v) {
  return v?.toString().trim() || null;
}

/**
 * Parse MAC addresses
 */
function parseMacAddresses(macString = "") {
  const eth = macString.match(/Ethernet:\s*([0-9A-Fa-f:-]+)/i)?.[1] || null;
  const wifi = macString.match(/Wi-Fi:\s*([0-9A-Fa-f:-]+)/i)?.[1] || null;

  return { eth, wifi };
}

/**
 * Build specs field
 */
function buildSpecs(row) {
  const parts = [];

  if (row.Description) parts.push(`HW: ${row.Description}`);
  if (row.Ram) parts.push(`RAM: ${row.Ram}`);
  if (row.Storage) parts.push(`Storage: ${row.Storage}`);
  if (row.Users) parts.push(`Users: ${row.Users}`);

  return parts.join(" | ");
}

/**
 * MAIN IMPORT FUNCTION (EXCEL)
 */
export async function importComputerAssetsExcel(filePath) {
  // 1. Read Excel file
  const workbook = xlsx.readFile(filePath);

  // 2. Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 3. Convert to JSON
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} assets`);

  // 4. Loop
  for (const row of rows) {
    try {
      const macs = parseMacAddresses(
        row.MACAddress || row.EthMacAdd || ""
      );

      const serial = clean(row.SerialNumber);

      if (!serial) {
        console.log("Skipping (missing serial):", row.ID);
        continue;
      }

      const asset = {
        asset_number:
          clean(row.AssetNumber) ||
          clean(row.hostname) ||
          clean(row.Hostname) ||
          null,

        serial_number: serial.replace(/\s+/g, ""),
        device_type: clean(row.DeviceType) || "Computer",
        brand: clean(row.Brand),
        model: clean(row.Model),

        eth_mac_addr: macs.eth || clean(row.EthMacAdd),
        wifi_mac_addr: macs.wifi || clean(row.WiFiMacAdd),

        purchase_date: clean(row.PurchaseDate),

        status: "Available",

        specs: buildSpecs(row),

        location: clean(row.hostname) || clean(row.Hostname),
      };

      await upsertComputerAsset(asset);

      console.log(`Imported: ${asset.serial_number}`);
    } catch (err) {
      console.log("Failed row:", row.ID, err.message);
    }
  }

  console.log("Import complete");
}

/**
 * Run directly
 */
importComputerAssetsExcel("./database/migrate/tblComputerAssets.xlsx");