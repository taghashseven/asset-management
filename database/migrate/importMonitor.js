import fs from "fs";
import xlsx from "xlsx";
import { createMonitor } from "../monitor.js";

console.log("Starting monitor import from Excel...");

/**
 * Clean helper
 */
function clean(v) {
  return v?.toString().trim() || null;
}

/**
 * Normalize status to match DB constraint
 */
function normalizeStatus(status = "") {
  const s = status.toString().toLowerCase().trim();

  if (!s) return "Available";
  if (s.includes("assign")) return "Assigned";
  if (s.includes("repair")) return "Repair";
  if (s.includes("retire")) return "Retired";

  return "Available";
}

/**
 * Build description field (optional enrichment)
 */
function buildDescription(row) {
  const parts = [];

  if (row.Description) parts.push(row.Description);
  if (row.Size) parts.push(`Size: ${row.Size}`);
  if (row.Type) parts.push(`Type: ${row.Type}`);

  return parts.join(" | ") || null;
}

/**
 * MAIN IMPORT FUNCTION (EXCEL → MONITORS)
 */
export async function importMonitorsExcel(filePath) {
  // 1. Read Excel file
  const workbook = xlsx.readFile(filePath);

  // 2. Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 3. Convert to JSON
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} monitors`);

  // 4. Loop rows
  for (const row of rows) {
    try {
      const serial = clean(row.SerialNumber || row.serial_number);

      if (!serial) {
        console.log("Skipping row (missing serial):", row.ID || row.id);
        continue;
      }

      const monitor = {
        asset_number:
          clean(row.AssetNumber || row.asset_number) || null,

        serial_number: serial.replace(/\s+/g, ""),

        brand: clean(row.Brand || row.brand),
        model: clean(row.Model || row.model),

        description: buildDescription(row),

        status: normalizeStatus(row.Status || row.status),

        notes: clean(row.Notes || row.notes),

        purchase_date: clean(row.PurchaseDate || row.purchase_date),

        location: clean(row.Location || row.location),
      };

      await createMonitor(monitor);

      console.log(`Imported: ${monitor.serial_number}`);
    } catch (err) {
      console.log("Failed row:", row.SerialNumber || row.ID, err.message);
    }
  }

  console.log("Monitor import complete");
}

/**
 * Run directly
 */
importMonitorsExcel("./database/migrate/tblMonitor.xlsx");