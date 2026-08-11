import  db  from "../database/db.js";
import fs from "fs/promises";
import path from "path";

export async function getAllComputerAssets() {
  const rows = await db.all(`
    SELECT 
      ca.*,
      (aa.employee_email IS NOT NULL) AS is_assigned,
      aa.employee_email AS assigned_to,
      e.first_name,
      e.last_name,
      e.job_title,
      (
        SELECT json_group_array(image_path)
        FROM computer_asset_images cai
        WHERE cai.asset_id = ca.asset_id
          AND cai.image_path IS NOT NULL
      ) AS images
    FROM computer_assets ca
    LEFT JOIN asset_assignments aa
      ON ca.serial_number = aa.serial_number
      AND aa.date_returned IS NULL
    LEFT JOIN employees e
      ON aa.employee_email = e.email
    ORDER BY
      e.job_title IS NULL,      -- Unassigned assets last
      e.job_title ASC,
      e.last_name ASC,
      e.first_name ASC,
      ca.asset_number ASC
  `);

  return rows.map(row => ({
    ...row,
    is_assigned: Boolean(row.is_assigned),
    images: JSON.parse(row.images || "[]")
  }));
}


export async function getComputerAssetById(id) {
  return db.get(
    `
    SELECT *
    FROM computer_assets
    WHERE asset_id = ?
    `,
    [id]
  );
}

export async function upsertComputerAsset(asset) {
  console.log("Upserting asset:", asset);

  const assetNumber = asset.asset_number?.trim() === "" ? null : asset.asset_number;

  try {
    // 1. Upsert the asset into computer_assets
    await db.run(
      `
      INSERT INTO computer_assets (
        asset_number,
        serial_number,
        device_type,
        brand,
        model,
        eth_mac_addr,
        wifi_mac_addr,
        purchase_date,
        status,
        specs,
        location,
        bitlocker_key , 
        description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)

      ON CONFLICT(serial_number)
      DO UPDATE SET
        asset_number = excluded.asset_number,
        device_type = excluded.device_type,
        brand = excluded.brand,
        model = excluded.model,
        eth_mac_addr = excluded.eth_mac_addr,
        wifi_mac_addr = excluded.wifi_mac_addr,
        purchase_date = excluded.purchase_date,
        status = excluded.status,
        specs = excluded.specs,
        location = excluded.location,
        bitlocker_key = excluded.bitlocker_key,
        description = excluded.description
      `,
      [
        assetNumber,
        asset.serial_number,
        asset.device_type,
        asset.brand,
        asset.model,
        asset.eth_mac_addr,
        asset.wifi_mac_addr,
        asset.purchase_date,
        asset.status,
        asset.specs,
        asset.location,
        asset.bitlocker_key,
        asset.description
      ]
    );

    // 2. Fetch the asset_id by serial number
    const row = await db.get(
      `SELECT asset_id FROM computer_assets WHERE serial_number = ?`,
      [asset.serial_number]
    );

    const assetId = row?.asset_id;

    // 3. Process and save images if asset.images is provided
    if (assetId && Array.isArray(asset.images) && asset.images.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "assets");
      await fs.mkdir(uploadDir, { recursive: true });

      for (const img of asset.images) {
        if (!img.string || !img.filename) continue;

        // Generate a collision-free filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(img.filename) || ".jpg";
        const savedFileName = `asset_${assetId}_${uniqueSuffix}${ext}`;

        const absolutePath = path.join(uploadDir, savedFileName);
        const relativeDbPath = `public/assets/${savedFileName}`;

        // Strip Base64 header prefix if present
        const base64Data = img.string.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Write image file to disk
        await fs.writeFile(absolutePath, buffer);

        // Record the image reference in DB
        await db.run(
          `INSERT INTO computer_asset_images (asset_id, image_path) VALUES (?, ?)`,
          [assetId, relativeDbPath]
        );
      }
    }

    return assetId;

  } catch (err) {
    console.error("Error upserting asset:", err);
    throw err;
  }
}

export async function updateComputerAssetStatus(assetId, status) {
  return db.run(
    `
    UPDATE computer_assets
    SET status = ?
    WHERE asset_id = ?
    `,
    [status, assetId]
  );
}

