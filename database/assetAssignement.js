import  db  from "../database/db.js";

/**
 * CREATE (assign asset)
 */
export async function createAssignment({
  serial_number,
  employee_email,
  notes = null
}) {
  const result = await db.run(
    `
    INSERT INTO asset_assignments (
      serial_number,
      employee_email,
      date_issued,
      notes
    )
    VALUES (?, ?, DATE('now'), ?)
    `,
    [serial_number, employee_email, notes]
  );

  // mark asset as assigned
  await db.run(
    `
    UPDATE computer_assets
    SET status = 'Assigned'
    WHERE serial_number = ?
    `,
    [serial_number]
  );

  return result.lastID;
}

/**
 * READ all assignments
 */
export async function getAllAssignments() {
  return db.all(`
    SELECT *
    FROM asset_assignments
    ORDER BY assignment_id DESC
  `);
}

/**
 * READ active assignments only
 */
export async function getActiveAssignments() {
  return db.all(`
    SELECT *
    FROM asset_assignments
    WHERE date_returned IS NULL
  `);
}

/**
 * UPDATE (return asset)
 */
export async function returnAssignment(assignment_id) {
  const assignment = await db.get(
    `
    SELECT serial_number
    FROM asset_assignments
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  await db.run(
    `
    UPDATE asset_assignments
    SET date_returned = DATE('now')
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  await db.run(
    `
    UPDATE computer_assets
    SET status = 'Available'
    WHERE serial_number = ?
    `,
    [assignment.serial_number]
  );
}

/**
 * DELETE (optional - usually avoid in audit systems)
 */
export async function deleteAssignment(assignment_id) {
  const assignment = await db.get(
    `
    SELECT serial_number
    FROM asset_assignments
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  if (!assignment) return;

  await db.run(
    `
    DELETE FROM asset_assignments
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  await db.run(
    `
    UPDATE computer_assets
    SET status = 'Available'
    WHERE serial_number = ?
    `,
    [assignment.serial_number]
  );
}