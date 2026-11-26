import db from "../database/db.js";

export const getUserMonitorsAndAssets = async () => {

  const rows = await db.all(`
    SELECT
        e.employee_id,
        e.email,
        e.first_name,
        e.last_name,
        e.department,

        ca.asset_number,
        ca.serial_number AS computer_serial_number,
        ca.brand AS computer_brand,
        ca.model AS computer_model,
        ca.description AS computer_description,
        ca.hostname AS computer_hostname,

        m.asset_number AS monitor_asset_number,
        m.serial_number AS monitor_serial_number,
        m.brand AS monitor_brand,
        m.model AS monitor_model,

        ef.form_id,
        ef.file_path AS form_path

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

    LEFT JOIN employee_forms ef
        ON ef.employee_id = e.employee_id

    ORDER BY e.department ASC, e.first_name ASC, e.last_name ASC
  `);


  const employees = new Map();

  for (const row of rows) {

    if (!employees.has(row.employee_id)) {

      employees.set(row.employee_id, {
        employee_id: row.employee_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        department: row.department,

        computers: [],
        monitors: [],
        forms: []
      });
    }

    const employee = employees.get(row.employee_id);


    // Add computer
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


    // Add monitor
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


    // Add forms
    if (row.form_id) {

      const exists = employee.forms.some(
        f => f.form_id === row.form_id
      );

      if (!exists) {
        employee.forms.push({
          form_id: row.form_id,
          path: row.form_path
        });
      }
    }
  }


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

export const getEmployeeDetails = async (employeeId) => {
  const employee = await db.get(
    "SELECT * FROM employees WHERE employee_id = ?",
    [employeeId]
  );

  if (!employee) return null;

  const resources = await db.all(`
    SELECT
      'computer' AS resource_type,
      ca.asset_number,
      ca.serial_number,
      ca.device_type,
      ca.brand,
      ca.model,
      ca.hostname,
      ca.location,
      aa.date_issued,
      aa.assignment_id
    FROM asset_assignments aa
    JOIN computer_assets ca ON ca.serial_number = aa.serial_number
    WHERE aa.employee_email = ? AND aa.date_returned IS NULL
    UNION ALL
    SELECT
      'monitor' AS resource_type,
      m.asset_number,
      m.serial_number,
      'Monitor' AS device_type,
      m.brand,
      m.model,
      NULL AS hostname,
      m.location,
      ma.date_issued,
      ma.id AS assignment_id
    FROM monitor_assignments ma
    JOIN monitors m ON m.serial_number = ma.monitor_serial_number
    WHERE ma.employee_email = ? AND ma.date_returned IS NULL
    ORDER BY resource_type, serial_number
  `, [employee.email, employee.email]);

  const history = await db.all(`
    SELECT
      'computer' AS resource_type,
      ca.asset_number,
      ca.serial_number,
      ca.brand,
      ca.model,
      aa.date_issued,
      aa.date_returned,
      aa.notes
    FROM asset_assignments aa
    JOIN computer_assets ca ON ca.serial_number = aa.serial_number
    WHERE aa.employee_email = ?
    UNION ALL
    SELECT
      'monitor' AS resource_type,
      m.asset_number,
      m.serial_number,
      m.brand,
      m.model,
      ma.date_issued,
      ma.date_returned,
      ma.notes
    FROM monitor_assignments ma
    JOIN monitors m ON m.serial_number = ma.monitor_serial_number
    WHERE ma.employee_email = ?
    ORDER BY date_issued DESC
  `, [employee.email, employee.email]);

  const forms = await db.all(
    "SELECT form_id, file_path FROM employee_forms WHERE employee_id = ? ORDER BY form_id DESC",
    [employeeId]
  );

  return { employee, resources, history, forms };
};

const RESOURCE_TABLES = {
  computer: {
    assets: "computer_assets",
    assignments: "asset_assignments",
    serialColumn: "serial_number",
    assignmentId: "assignment_id"
  },
  monitor: {
    assets: "monitors",
    assignments: "monitor_assignments",
    serialColumn: "monitor_serial_number",
    assignmentId: "id"
  }
};

export const getAssetDetails = async (type, serialNumber) => {
  const resource = RESOURCE_TABLES[type];
  if (!resource) throw new Error("Unsupported resource type");

  const asset = await db.get(
    `SELECT * FROM ${resource.assets} WHERE serial_number = ?`,
    [serialNumber]
  );

  if (!asset) return null;

  const history = await db.all(`
    SELECT
      assignment.${resource.assignmentId} AS assignment_id,
      assignment.employee_email,
      employee.first_name,
      employee.last_name,
      employee.department,
      employee.job_title,
      assignment.date_issued,
      assignment.date_returned,
      assignment.notes
    FROM ${resource.assignments} assignment
    JOIN employees employee ON employee.email = assignment.employee_email
    WHERE assignment.${resource.serialColumn} = ?
    ORDER BY assignment.date_issued DESC, assignment.${resource.assignmentId} DESC
  `, [serialNumber]);

  return { type, asset, history };
};

export const transferAsset = async ({ type, serialNumber, employeeEmail, notes }) => {
  const resource = RESOURCE_TABLES[type];
  if (!resource) throw new Error("Unsupported resource type");
  if (!serialNumber) throw new Error("A serial number is required");

  await db.run("BEGIN IMMEDIATE");
  try {
    const asset = await db.get(
      `SELECT serial_number FROM ${resource.assets} WHERE serial_number = ?`,
      [serialNumber]
    );
    if (!asset) throw new Error("Resource not found");

    if (employeeEmail) {
      const employee = await db.get(
        "SELECT email, active FROM employees WHERE email = ?",
        [employeeEmail]
      );
      if (!employee) throw new Error("Employee not found");
      if (!employee.active) throw new Error("Cannot assign resources to an inactive employee");
    }

    const currentAssignment = await db.get(
      `SELECT ${resource.assignmentId} AS assignment_id, employee_email
       FROM ${resource.assignments}
       WHERE ${resource.serialColumn} = ? AND date_returned IS NULL`,
      [serialNumber]
    );

    if (currentAssignment?.employee_email === employeeEmail) {
      throw new Error("Resource is already assigned to this employee");
    }

    if (currentAssignment) {
      await db.run(
        `UPDATE ${resource.assignments}
         SET date_returned = CASE
           WHEN date_issued IS NULL OR date_issued <= DATE('now') THEN DATE('now')
           ELSE date_issued
         END
         WHERE ${resource.assignmentId} = ?`,
        [currentAssignment.assignment_id]
      );
    }

    if (employeeEmail) {
      await db.run(
        `INSERT INTO ${resource.assignments}
         (${resource.serialColumn}, employee_email, date_issued, notes)
         VALUES (?, ?, DATE('now'), ?)`,
        [serialNumber, employeeEmail, notes || null]
      );
    }

    const status = employeeEmail ? "Assigned" : "Available";
    await db.run(
      `UPDATE ${resource.assets} SET status = ? WHERE serial_number = ?`,
      [status, serialNumber]
    );

    await db.run("COMMIT");
    return { status };
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
};

export const getSystemAlerts = async () => {
  const alerts = await db.all(`
    SELECT
      'inactive_employee_assignment' AS alert_type,
      'high' AS severity,
      'computer' AS resource_type,
      ca.serial_number,
      ca.asset_number,
      ca.brand,
      ca.model,
      ca.status AS asset_status,
      e.employee_id,
      e.email AS employee_email,
      e.first_name,
      e.last_name,
      aa.date_issued
    FROM asset_assignments aa
    JOIN computer_assets ca ON ca.serial_number = aa.serial_number
    JOIN employees e ON e.email = aa.employee_email
    WHERE aa.date_returned IS NULL AND e.active = 0

    UNION ALL

    SELECT
      'inactive_employee_assignment',
      'high',
      'monitor',
      m.serial_number,
      m.asset_number,
      m.brand,
      m.model,
      m.status,
      e.employee_id,
      e.email,
      e.first_name,
      e.last_name,
      ma.date_issued
    FROM monitor_assignments ma
    JOIN monitors m ON m.serial_number = ma.monitor_serial_number
    JOIN employees e ON e.email = ma.employee_email
    WHERE ma.date_returned IS NULL AND e.active = 0

    UNION ALL

    SELECT
      'assignment_status_mismatch',
      'medium',
      'computer',
      ca.serial_number,
      ca.asset_number,
      ca.brand,
      ca.model,
      ca.status,
      e.employee_id,
      e.email,
      e.first_name,
      e.last_name,
      aa.date_issued
    FROM computer_assets ca
    JOIN asset_assignments aa ON aa.serial_number = ca.serial_number
      AND aa.date_returned IS NULL
    JOIN employees e ON e.email = aa.employee_email
    WHERE ca.status != 'Assigned' AND e.active != 0

    UNION ALL

    SELECT
      'assignment_status_mismatch',
      'medium',
      'computer',
      ca.serial_number,
      ca.asset_number,
      ca.brand,
      ca.model,
      ca.status,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    FROM computer_assets ca
    WHERE ca.status = 'Assigned'
      AND NOT EXISTS (
        SELECT 1 FROM asset_assignments aa
        WHERE aa.serial_number = ca.serial_number AND aa.date_returned IS NULL
      )

    UNION ALL

    SELECT
      'assignment_status_mismatch',
      'medium',
      'monitor',
      m.serial_number,
      m.asset_number,
      m.brand,
      m.model,
      m.status,
      e.employee_id,
      e.email,
      e.first_name,
      e.last_name,
      ma.date_issued
    FROM monitors m
    JOIN monitor_assignments ma ON ma.monitor_serial_number = m.serial_number
      AND ma.date_returned IS NULL
    JOIN employees e ON e.email = ma.employee_email
    WHERE m.status NOT IN ('Assigned', 'Deployed') AND e.active != 0

    UNION ALL

    SELECT
      'assignment_status_mismatch',
      'medium',
      'monitor',
      m.serial_number,
      m.asset_number,
      m.brand,
      m.model,
      m.status,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    FROM monitors m
    WHERE m.status IN ('Assigned', 'Deployed')
      AND NOT EXISTS (
        SELECT 1 FROM monitor_assignments ma
        WHERE ma.monitor_serial_number = m.serial_number AND ma.date_returned IS NULL
      )
    ORDER BY severity, resource_type, serial_number
  `);

  return alerts;
};


export const createFormForUser = async () =>{
  const create = await db.all(`
        
    `)
}
