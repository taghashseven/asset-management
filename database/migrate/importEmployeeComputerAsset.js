import xlsx from "xlsx";
import  db  from "../db.js";

/**
 * Parse Excel date safely
 */
function parseDate(value) {
  if (!value) return null;

  // Excel or string date handling
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Main importer
 */
export async function importAssetAssignments(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} rows`);

  for (const row of rows) {
    try {
      const serial_number = row.AssetSerialNumber?.trim();
      const employee_email = row.EmployeeEmail?.trim();

      if (!serial_number || !employee_email) {
        console.log("Skipping invalid row:", row);
        continue;
      }

      const date_issued = parseDate(row.DateIssued);
      const date_returned = parseDate(row.DateReturned);
      const notes = row.Notes || null;

      await db.run(
        `
        INSERT INTO asset_assignments (
          serial_number,
          employee_email,
          date_issued,
          date_returned,
          notes
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          serial_number,
          employee_email,
          date_issued,
          date_returned,
          notes
        ]
      );

      console.log(`Imported: ${serial_number} → ${employee_email}`);
    } catch (err) {
      console.log("Failed row:", row, err.message);
    }
  }

  console.log("Import complete");
}

importAssetAssignments("./database/migrate/tblAssetAssignments.xlsx");
console.log("Import complete");