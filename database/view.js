import db from "../database/db.js";

export const getUserMonitorsAndAssets = async () => {

  const rows = await db.all(`
    SELECT
        e.employee_id,
        e.email,
        e.first_name,
        e.last_name,
        e.department, -- Included department field here

        ca.asset_number,
        ca.serial_number AS computer_serial_number,
        ca.brand AS computer_brand,
        ca.model AS computer_model,

        m.asset_number AS monitor_asset_number,
        m.serial_number AS monitor_serial_number,
        m.brand AS monitor_brand,
        m.model AS monitor_model

    FROM employees e

    LEFT JOIN asset_assignments aa
        ON aa.employee_email = e.email
       AND aa.date_returned IS NULL

    LEFT JOIN computer_assets ca
        ON ca.serial_number = aa.serial_number

    LEFT JOIN monitor_assignments ma
        ON ma.employee_email = e.email
       AND ma.date_returned IS NULL

    LEFT JOIN monitors m
        ON m.serial_number = ma.monitor_serial_number

    ORDER BY e.department ASC, e.first_name ASC, e.last_name ASC -- Sorted by department first
  `);

  const employees = new Map();

  for (const row of rows) {

    if (!employees.has(row.employee_id)) {

      employees.set(row.employee_id, {
        employee_id: row.employee_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        department: row.department, // Added to the mapped payload object structure
        computers: [],
        monitors: []
      });
    }

    const employee = employees.get(row.employee_id);

    // Add computer if present and not already added
    if (row.computer_serial_number) {

      const exists = employee.computers.some(
        c => c.serial_number === row.computer_serial_number
      );

      if (!exists) {
        employee.computers.push({
          asset_number: row.asset_number,
          serial_number: row.computer_serial_number,
          brand: row.computer_brand,
          model: row.computer_model
        });
      }
    }

    // Add monitor if present and not already added
    if (row.monitor_serial_number) {

      const exists = employee.monitors.some(
        m => m.serial_number === row.monitor_serial_number
      );

      if (!exists) {
        employee.monitors.push({
          asset_number: row.monitor_asset_number,
          serial_number: row.monitor_serial_number,
          brand: row.monitor_brand,
          model: row.monitor_model
        });
      }
    }
  }

  // Because JS Maps maintain insertion order, turning this Map into an array 
  // preserves the SQL query's exact "ORDER BY department" sequence.
  return Array.from(employees.values());
};


// computers not assigned 
export const getUnassignedComputers = async () => {
  const rows = await db.all(`
    SELECT *
    FROM computer_assets
    WHERE serial_number NOT IN (
      SELECT serial_number
      FROM asset_assignments
        WHERE date_returned IS NULL
    )
  `);
  return rows;
}

// not assigned monitors 
export const getUnassignedMonitors = async () => {
    const rows = await db.all(`
        SELECT *
        FROM monitors
        WHERE serial_number NOT IN (
            SELECT monitor_serial_number
            FROM monitor_assignments
            WHERE date_returned IS NULL
        )
    `);
    return rows;
}



