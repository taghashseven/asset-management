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



// upload a new form for an employee (Base64 version)
export async function uploadEmployeeForm(employeeID, base64Data) {
  // 1. Validate file size immediately (Base64 string length * 0.75 gives approx size in bytes)
  console.log("Uploading form for employee ID:", employeeID);
  const estimatedSize = base64Data.length * 0.75;
  if (estimatedSize > 5 * 1024 * 1024) {
    throw new Error("File too large");
  }

  const timestamp = Date.now();
  const newFileName = `${employeeID}.${timestamp}.pdf`;
  const targetDir = 'public/forms';
  const filePath = path.join(targetDir, newFileName);

  try {
    // 2. Ensure the directory exists
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    // 3. Remove metadata header (e.g., "data:image/png;base64,") if present
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

    // 4. Convert Base64 back to binary Buffer and write to disk
    const buffer = Buffer.from(cleanBase64, 'base64');
    await fs.promises.writeFile(filePath, buffer);

  } catch (err) {
    console.error("Error saving file from Base64:", err);
    throw new Error("Failed to save file");
  }

  // 5. Insert into database 
  try {
    const result = await db.run(
      `
      INSERT INTO employee_forms (employee_id, file_path)
      VALUES (?, ?)
    `,
      [employeeID, filePath]
    );
    return result.lastID;
  } catch (err) {
    console.error("Error inserting form record into database:", err);
    
    // 6. Reverse the file save if database insert fails
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkErr) {
      console.error("Error deleting file after database insert failure:", unlinkErr);
    }

    throw new Error("Failed to insert form record into database");
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