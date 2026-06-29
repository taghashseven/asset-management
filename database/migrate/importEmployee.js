import xlsx from "xlsx";
import db from "../db.js";

/**
 * Import employees from Excel file into SQLite
 */
export async function importEmployees(filePath) {
  // 1. Read Excel file
  const workbook = xlsx.readFile(filePath);

  // 2. Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 3. Convert to JSON
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} rows`);

  // 4. Insert rows into DB
  for (const row of rows) {
    const email = row.Email?.trim();
    const firstName = row.Firstname?.trim();
    const lastName = row.Lastname?.trim();
    const department = row.Department?.trim() || null;
    const jobTitle = row["Job Title"]?.trim() || null;

    // skip invalid rows
    if (!email || !firstName || !lastName) {
      console.log("Skipping invalid row:", row);
      continue;
    }

    try {
      await db.run(
        `
        INSERT INTO employees (
          email,
          first_name,
          last_name,
          department,
          job_title
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [email, firstName, lastName, department, jobTitle]
      );

      console.log(`Inserted: ${email}`);
    } catch (err) {
      console.log(`Failed: ${email}`, err.message);
    }
  }

  console.log("Import complete");
}


// import 
importEmployees("./database/migrate/tblEmployees.xlsx");