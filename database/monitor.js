import  db  from "../database/db.js";

/**
 * Get all monitors
 */
export const getAllMonitors = async () => {
  return db.all(`
    SELECT *
    FROM monitors
  `);
};

/**
 * Create a monitor (insert row)
 */
export const createMonitor = async (monitor) => {
  const result = await db.run(
    `
    INSERT INTO monitors
    (
      asset_number,
      serial_number,
      brand,
      model,
      description,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      monitor.asset_number,
      monitor.serial_number,
      monitor.brand,
      monitor.model,
      monitor.description,
      monitor.status || "Available",
    ]
  );

  return result.lastID;
};

/**
 * Upsert a monitor (Insert or Update on serial_number conflict)
 */
export const upsertMonitor = async (monitor) => {
  const result = await db.run(
    `
    INSERT INTO monitors 
    (
      asset_number,
      serial_number,
      brand,
      model,
      description,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(serial_number) DO UPDATE SET
      brand = excluded.brand,
      model = excluded.model,
      description = excluded.description,
      status = CASE WHEN monitors.status = 'Available' THEN excluded.status ELSE monitors.status END
    `,
    [
      monitor.asset_number,
      monitor.serial_number,
      monitor.brand,
      monitor.model,
      monitor.description,
      monitor.status || "Available"
    ]
  );

  return result.changes;
};