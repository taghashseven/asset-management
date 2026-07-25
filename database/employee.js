import db from "../database/db.js";
import { pathToFileURL } from "url";
import fs from 'fs';
import path from 'path';

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

  const timestamp = Date.now();
  const newFileName = `${employeeID}.${timestamp}.pdf`;
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

// delete a form for an employee
export async function deleteEmployeeForm(formID) {
  try {
    // 1. Get the file path from the database
    const form = await db.get(
      "SELECT file_path FROM employee_forms WHERE form_id = ?",
      [formID]
    );

    if (!form) {
      throw new Error("Form not found");
    }

    // 2. Delete the file from the filesystem
    await fs.promises.unlink(form.file_path);

    // 3. Delete the record from the database
    await db.run(
      "DELETE FROM employee_forms WHERE form_id = ?",
      [formID]
    );
  } catch (err) {
    console.error("Error deleting employee form:", err);
    throw new Error("Failed to delete employee form");
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