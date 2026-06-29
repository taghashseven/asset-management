import fs from "fs";
import csv from "csv-parser";
import db from "../db.js"; 
import { upsertMonitor } from "../monitor.js"; 

/**
 * Extracts brand, model, and serial number from strings like:
 * "SAM LS27C31x (H9JX500507   )" or "DEL SE2717H/HX (K9V8V9410NTS)"
 */
function parseMonitorDetails(monitorString = "") {
  const cleanStr = monitorString.trim();
  if (!cleanStr) return null;

  // Regex looks for "Brand Model (SerialNumber)" pattern
  const match = cleanStr.match(/^([^(]+)\(([^)]+)\)/);

  if (match) {
    const fullModel = match[1].trim();
    const serial = match[2].trim();

    // Split out the first word as the brand, rest as model
    const words = fullModel.split(/\s+/);
    const brand = words[0] || "Unknown";
    const model = words.slice(1).join(" ") || fullModel;

    return { brand, model, serial };
  }

  // Fallback if formatting doesn't contain parenthesized serials
  return {
    brand: "Unknown",
    model: cleanStr,
    serial: null,
  };
}

/**
 * Main import function for Monitor records (With Active Upsert)
 */
export async function importMonitorsCSV(filePath) {
  const rows = [];

  // 1. Stream parse the CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Processing rows for monitor upserts...`);
  
  // Track serials inside this loop run execution instance to prevent parsing duplicates in the *same* CSV file
  const processedSerials = new Set();

  // 2. Loop through and extract monitors
  for (const row of rows) {
    try {
      if (!row.Monitors) continue;

      // Some rows might contain multiple monitors separated by semicolons or commas
      const rawMonitorEntries = row.Monitors.split(/;|,/);

      for (const entry of rawMonitorEntries) {
        const parsed = parseMonitorDetails(entry);
        
        if (!parsed || !parsed.serial || parsed.serial === "0") {
          continue;
        }

        // Avoid reprocessing the same exact serial number multiple times in this single loop pass
        if (processedSerials.has(parsed.serial)) {
          continue;
        }

        const monitorAsset = {
          asset_number: null, 
          serial_number: parsed.serial,
          brand: parsed.brand,
          model: parsed.model,
          description: `Imported/Updated from CSV. Associated Host: ${row.Hostname}`,
          status: "Available"
        };

        // --- REMOVED THE LEGACY `db.get` SKIP CHECK ---
        // Let the SQLite database engine safely handle conflicts, updates, and overwrites dynamically!
        await upsertMonitor(monitorAsset);
        processedSerials.add(parsed.serial);
        
        console.log(`Upserted Monitor: ${parsed.brand} ${parsed.model} [S/N: ${parsed.serial}]`);
      }
    } catch (err) {
      console.log(`Failed to process monitor row for Host ${row.Hostname}:`, err.message);
    }
  }

  console.log("Monitor import execution sequence complete.");
}

// Fire execution run matching your directory standard
importMonitorsCSV("./database/migrate/assets.csv");