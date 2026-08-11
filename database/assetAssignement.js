import db from "../database/db.js";

/**
 * CREATE (assign asset)
 */
export async function createAssignment({
  serial_number,
  employee_email,
  date_issued, 
  notes = null
}) {
  console.log("Creating assignment:", serial_number, employee_email, date_issued, notes);
  
  // 1. Try to insert the assignment. If the index blocks it, this throws a clean error.
  try {
    const result = await db.run(
      `
      INSERT INTO asset_assignments (
        serial_number,
        employee_email,
        date_issued,
        notes
      )
      VALUES (?, ?, ?, ?)
      `,
      [serial_number, employee_email, date_issued, notes]
    );

    // 2. Only update the asset status if the assignment actually succeeded!
    await db.run(
      `
      UPDATE computer_assets
      SET status = 'Assigned'
      WHERE serial_number = ?
      `,
      [serial_number]
    );

    return result.lastID;
  } catch (error) {
    // If SQLite blocks it due to our partial unique index, intercept it with a human-readable message
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error(`Asset ${serial_number} is already currently assigned and hasn't been returned yet.`);
    }
    throw error;
  }
}

/**
 * UPDATE method (Be careful here!)
 */
export async function updateAssignment(
  assignment_id, 
  { date_issued, date_returned, notes }
) {
  // Trap Alert Fixed: We no longer allow serial_number or employee_email updates here
  // to prevent computer_assets.status from going completely out of sync.

  // console recied date 
  console.log("Updating assignment:", assignment_id, date_issued, date_returned, notes);

  const result = await db.run(
    `
    UPDATE asset_assignments
    SET date_issued = ?, date_returned = ?, notes = ?
    WHERE assignment_id = ?
    `,
    [date_issued, date_returned, notes, assignment_id]
  );

  return result;
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
 * READ active assignments only (This works perfectly with our business rules!)
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
    SELECT serial_number, date_returned
    FROM asset_assignments
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.date_returned !== null) {
    throw new Error("This asset has already been returned.");
  }

  // 1. Close out the assignment
  await db.run(
    `
    UPDATE asset_assignments
    SET date_returned = DATE('now')
    WHERE assignment_id = ?
    `,
    [assignment_id]
  );

  // 2. Free up the hardware asset for future checkouts
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
 * DELETE
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

  // Free up the asset status since the assignment record was wiped out completely
  await db.run(
    `
    UPDATE computer_assets
    SET status = 'Available'
    WHERE serial_number = ?
    `,
    [assignment.serial_number]
  );
}