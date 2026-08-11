


import  db  from "../database/db.js";

export async function assignMonitor({
  monitor_serial_number,
  employee_email,
  date_returned ,
  notes
}) {
  console.log(monitor_serial_number , employee_email , date_returned , )
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



// update 
export async function updateMonitorAssignment({
  id,
  monitor_serial_number,
  employee_email,
  date_issued,
  date_returned,
  notes
}) {
  if (!id) {
    throw new Error("Assignment id is required");
  }

  const result = await db.run(
    `
    UPDATE monitor_assignments
    SET
      monitor_serial_number = ?,
      employee_email = ?,
      date_issued = ?,
      date_returned = ?,
      notes = ?
    WHERE id = ?
    `,
    [
      monitor_serial_number,
      employee_email,
      date_issued,
      date_returned,
      notes,
      id
    ]
  );

  if (result.changes === 0) {
    throw new Error("Monitor assignment not found");
  }

  return await db.get(
    `
    SELECT *
    FROM monitor_assignments
    WHERE id = ?
    `,
    [id]
  );
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