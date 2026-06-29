import xlsx from "xlsx";
import  db  from "../db.js";
import { assignMonitor } from "../monitorAssignement.js";



export async function importMonitorAssignments(filePath) {
  const workbook = xlsx.readFile(filePath);

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} rows`);

  for (const row of rows) {
    const email = row.email?.trim();
    const serial_number = row.serial_number?.trim();
    const notes = row.notes?.trim() || null;

    if (!email || !serial_number) {
      console.log("Skipping invalid row:", row);
      continue;
    }

    try {
      await assignMonitor({
        monitor_serial_number: serial_number,
        employee_email: email,
        notes
      });

      console.log(`Assigned: ${email} → ${serial_number}`);

    } catch (err) {
      console.log(`Failed row: ${email}`, err.message);
    }
  }

  console.log("Import complete");
}

importMonitorAssignments("./database/migrate/tblMonitorAssignments.xlsx")
  .then(() => {
    console.log("All assignments processed.");
  })
  .catch((err) => {
    console.error("Error during import:", err);
  });