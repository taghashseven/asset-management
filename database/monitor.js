import  db  from "../database/db.js";
import fs from "fs/promises";
import path from "path";
/**
 * Get all monitors
 */
export const getAllMonitors = async () => {
  const rows = await db.all(`
    SELECT 
      m.*,
      COALESCE(
        JSON_GROUP_ARRAY(
          CASE 
            WHEN mi.image_id IS NOT NULL 
            THEN JSON_OBJECT('image_id', mi.image_id, 'image_path', mi.image_path)
            ELSE NULL 
          END
        ) FILTER (WHERE mi.image_id IS NOT NULL),
        '[]'
      ) AS images
    FROM monitors m
    LEFT JOIN monitor_images mi ON m.monitor_id = mi.monitor_id
    GROUP BY m.monitor_id
  `);

  // Parse JSON strings returned by SQLite
  return rows.map((row) => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
  }));
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
  console.log("Upserting monitor:", monitor);

  const assetNumber = monitor.asset_number?.trim() === "" ? null : monitor.asset_number;

  try {
    // 1. Upsert monitor record
    await db.run(
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
        asset_number = excluded.asset_number,
        brand = excluded.brand,
        model = excluded.model,
        description = excluded.description,
        status = CASE WHEN monitors.status = 'Available' THEN excluded.status ELSE monitors.status END
      `,
      [
        assetNumber,
        monitor.serial_number,
        monitor.brand,
        monitor.model,
        monitor.description,
        monitor.status || "Available"
      ]
    );

    // 2. Resolve monitor_id via serial_number
    const row = await db.get(
      `SELECT monitor_id FROM monitors WHERE serial_number = ?`,
      [monitor.serial_number]
    );

    const monitorId = row?.monitor_id;

    // 3. Process base64 images if monitor.images exists
    if (monitorId && Array.isArray(monitor.images) && monitor.images.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "monitors");
      await fs.mkdir(uploadDir, { recursive: true });

      for (const img of monitor.images) {
        if (!img.string || !img.filename) continue;

        // Generate unique filename to avoid overwrites
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(img.filename) || ".jpg";
        const savedFileName = `monitor_${monitorId}_${uniqueSuffix}${ext}`;

        const absolutePath = path.join(uploadDir, savedFileName);
        const relativeDbPath = `public/monitors/${savedFileName}`;

        // Strip Base64 header prefix if present
        const base64Data = img.string.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Save image to disk
        await fs.writeFile(absolutePath, buffer);

        // Record reference in monitor_images table
        await db.run(
          `INSERT INTO monitor_images (monitor_id, image_path) VALUES (?, ?)`,
          [monitorId, relativeDbPath]
        );
      }
    }

    return monitorId;

  } catch (err) {
    console.error("Error upserting monitor:", err);
    throw err;
  }
};