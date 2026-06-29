


import  db  from "../database/db.js";

export async function assignMonitor({
  monitor_serial_number,
  employee_email,
  notes
}) {
  if (!monitor_serial_number || !employee_email) {
    throw new Error("monitor_serial_number and employee_email are required");
  }

  const result = await db.run(
    `
    INSERT INTO monitor_assignments
    (
      monitor_serial_number,
      employee_email,
      date_issued,
      notes
    )
    VALUES (?, ?, DATE('now'), ?)
    `,
    [monitor_serial_number, employee_email, notes]
  );

  return {
    assignment_id: result.lastID,
    monitor_serial_number,
    employee_email,
    date_issued: new Date().toISOString().split("T")[0],
    notes
  };
}


/**
 * Get all monitor assignments
 */
export async function getAllMonitorAssignments() {
  return db.all(`
    SELECT *
    FROM monitor_assignments
    ORDER BY id DESC
  `);
}