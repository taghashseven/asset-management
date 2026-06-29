import  db  from "../database/db.js";


export async function getAllComputerAssets() {
  return db.all(`
    SELECT 
      ca.*,
      (aa.employee_email IS NOT NULL) AS is_assigned,
      aa.employee_email AS assigned_to
    FROM computer_assets ca
    LEFT JOIN asset_assignments aa 
      ON ca.serial_number = aa.serial_number 
      AND aa.date_returned IS NULL
    ORDER BY ca.asset_number
  `);
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
  console.log("Upserting asset:", asset); // Log the asset being upserted
  try {
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
      bitlocker_key
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

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
      bitlocker_key = excluded.bitlocker_key
    `,
    [
      asset.asset_number,
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
      asset.bitlocker_key
    ]
  );
  }
  catch (err) {
    console.error("Error upserting asset:", err);
    throw err; // Re-throw the error after logging it
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

