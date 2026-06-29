import db from "../database/db.js";
import { pathToFileURL } from "url";

export async function getAll() {
  return db.all("SELECT * FROM employees");
}

export async function getById(id) {
  return db.get(
    "SELECT * FROM employees WHERE employee_id = ?",
    [id]
  );
}

export async function create(employee) {
  return db.run(
    `
    INSERT INTO employees
    (email, first_name, last_name, department, job_title)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      employee.email,
      employee.first_name,
      employee.last_name,
      employee.department,
      employee.job_title
    ]
  );
}

export async function update(id, employee) {
  return db.run(
    `
    UPDATE employees
    SET email=?, first_name=?, last_name=?, department=?, job_title=?
    WHERE employee_id=?
    `,
    [
      employee.email,
      employee.first_name,
      employee.last_name,
      employee.department,
      employee.job_title,
      id
    ]
  );
}

export async function remove(id) {
  return db.run(
    "DELETE FROM employees WHERE employee_id=?",
    [id]
  );
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