import db from "../database/db.js";
import { pathToFileURL } from "url";
import fs from 'fs';
import path from 'path';
// Ensure you are importing from 'node:fs/promises' for async/await support
import { unlink } from 'node:fs/promises';
// Get the directory path of employee.js dynamically
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// delete a form for an employee
// delete a form for an employee
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';



export async function getAll() {
  const query = `
    SELECT 
      e.*,
      -- Aggregate currently assigned computer serial numbers into an array
      COALESCE(
        (
          SELECT json_group_array(ca.serial_number)
          FROM asset_assignments aa
          INNER JOIN computer_assets ca ON ca.serial_number = aa.serial_number
          WHERE aa.employee_email = e.email AND aa.date_returned IS NULL
        ),
        '[]'
      ) AS computers,

      -- Aggregate currently assigned monitor serial numbers into an array
      COALESCE(
        (
          SELECT json_group_array(m.serial_number)
          FROM monitor_assignments ma
          INNER JOIN monitors m ON m.serial_number = ma.monitor_serial_number
          WHERE ma.employee_email = e.email AND ma.date_returned IS NULL
        ),
        '[]'
      ) AS monitors
    FROM employees e;
  `;

  const rows = await db.all(query);

  // Parse the JSON string outputs back into native JavaScript arrays
  return rows.map(row => ({
    ...row,
    active: Boolean(row.active), // Safely cast 1/0 to true/false
    computers: JSON.parse(row.computers),
    monitors: JSON.parse(row.monitors)
  }));
}

export async function getById(id) {
  return db.get(
    "SELECT * FROM employees WHERE employee_id = ?",
    [id]
  );
}

export async function upsert(employee) {

   const active =
    employee.active === true ||
    employee.active === 1 ||
    employee.active === "true" ||
    employee.active === "1"
      ? 1
      : 0;

  return db.run(
    `
    INSERT INTO employees
    (
      email,
      first_name,
      last_name,
      department,
      job_title,
      active,
      note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email)
    DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      department = excluded.department,
      job_title = excluded.job_title,
      active = excluded.active,
      note = excluded.note
    `,
    [
      employee.email,
      employee.first_name,
      employee.last_name,
      employee.department,
      employee.job_title,
      active,
      employee.note
    ]
  );
}


export async function remove(id) {
  return db.run(
    "DELETE FROM employees WHERE employee_id=?",
    [id]
  );
}


// forms utility functions 

export async function getAllEmployeeForms(employeeID){
    const query = `
    SELECT * FROM employee_forms WHERE employee_id = ?;
  `;
  return db.all(query, [employeeID]);
}



export async function uploadEmployeeForm(employeeID, base64Input) {
  console.log("Uploading form for employee ID:", employeeID);

  // 1. Normalize input to extract the raw Base64 string
  let rawBase64 = base64Input;
  if (Array.isArray(base64Input)) {
    rawBase64 = base64Input[0]?.string || base64Input[0];
  } else if (typeof base64Input === "object" && base64Input !== null) {
    rawBase64 = base64Input.string || base64Input.file_path || base64Input;
  }

  if (typeof rawBase64 !== "string") {
    throw new Error("Invalid base64 payload received. Expected a string.");
  }

  // 2. Validate file size (5MB limit)
  const estimatedSize = rawBase64.length * 0.75;
  if (estimatedSize > 5 * 1024 * 1024) {
    throw new Error("File too large");
  }

  const newFileName = `${employeeID}${base64Input[0].filename}.pdf`;
  const targetDir = 'public/forms';
  const fullFilePath = path.join(targetDir, newFileName);
  const relativeDbPath = path.join('forms', newFileName).replace(/\\/g, '/');

  let fileWritten = false;

  try {
    // 3. Write file to disk first
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, 'base64');
    await fs.promises.writeFile(fullFilePath, buffer);
    fileWritten = true;

    // 4. Insert dynamic record into employee_forms table
    const query = `
      INSERT INTO employee_forms (employee_id, file_path) 
      VALUES (?, ?)
    `;
    
    // Execute query (using run or statement execution based on your sqlite wrapper)
    const result = await db.run(query, [employeeID, relativeDbPath]);

    console.log(`Saved form ID ${result?.lastID} for employee ID ${employeeID}`);

    return {
      success: true,
      formID: result?.lastID,
      employeeID,
      filePath: relativeDbPath
    };

  } catch (err) {
    console.error("Error in uploadEmployeeForm:", err.message);

    // Rollback: Clean up orphaned file on disk if DB insertion fails
    if (fileWritten) {
      try {
        await fs.promises.unlink(fullFilePath);
        console.log(`Cleaned up orphaned file: ${fullFilePath}`);
      } catch (cleanupErr) {
        console.error("Failed to delete orphaned file during rollback:", cleanupErr);
      }
    }

    throw new Error("Failed to save file and insert record");
  }
}


export async function deleteEmployeeForm(formID) {
  // Start explicit transaction
  await db.run("BEGIN IMMEDIATE");

  try {
    // 1. Fetch form path inside transaction context
    const form = await db.get(
      "SELECT file_path FROM employee_forms WHERE form_id = ?",
      [formID]
    );

    if (!form) {
      const notFoundErr = new Error(`Form with ID ${formID} not found in database.`);
      console.error(`[deleteEmployeeForm Error]: ${notFoundErr.message}`);
      await db.run("ROLLBACK");
      throw notFoundErr;
    }

    const targetPath = path.join(__dirname, '..', 'public', form.file_path);

    // 2. Delete the DB record first
    await db.run(
      "DELETE FROM employee_forms WHERE form_id = ?",
      [formID]
    );

    // 3. Delete the file from the filesystem
    try {
      await rm(targetPath, { force: true, maxRetries: 3, retryDelay: 100 });
    } catch (fsErr) {
      // Log the exact filesystem failure details before rolling back
      console.error(`[deleteEmployeeForm FS Error]: Failed to delete file at path: "${targetPath}"`);
      console.error(`[deleteEmployeeForm FS Error Details]:`, {
        code: fsErr.code,
        message: fsErr.message,
        stack: fsErr.stack
      });

      await db.run("ROLLBACK");
      throw new Error(`File deletion failed on disk (${fsErr.code || fsErr.message}); database changes rolled back.`);
    }

    // 4. Commit transaction only when disk operation succeeds
    await db.run("COMMIT");
    console.log(`[deleteEmployeeForm Success]: Successfully deleted form ID ${formID} and file at "${targetPath}".`);
    return { success: true };

  } catch (err) {
    // Safety net: ensure rollback if any unhandled error occurred
    try {
      await db.run("ROLLBACK");
    } catch (rollbackErr) {
      // Transaction was already closed/rolled back
    }

    // Log top-level failure trace
    console.error(`[deleteEmployeeForm Failed]: Could not perform atomic deletion for Form ID ${formID}.`);
    console.error(`[deleteEmployeeForm Stack]:`, err);

    throw err;
  }
}

// ----------------------
// MAIN GUARD (FIXED)
// ----------------------

const isMain =
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  (async () => {
    // console.log("Running directly");

    // const newEmployee = {
    //   email: "jonahm@crosscountry.africa",
    //   first_name: "Jonah",
    //   last_name: "M",
    //   department: "IT",
    //   job_title: "IT Support"
    // };

    // const result = await create(newEmployee);
    // console.log("Employee created:", result);

    // read all from database 
    let results = await getAll();
    console.log("All employees:", results);
  })();
}