

import { db } from "../database/db.js";

export default class ServerRoomModel {

  static async getAll() {
    return db.all(`
      SELECT *
      FROM server_room_assets
    `);
  }

  static async create(asset) {

    const result = await db.run(
      `
      INSERT INTO server_room_assets
      (
        asset_number,
        asset_type,
        computer_name,
        specs,
        description,
        purchase_date
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        asset.asset_number,
        asset.asset_type,
        asset.computer_name,
        asset.specs,
        asset.description,
        asset.purchase_date
      ]
    );

    return result.lastID;
  }
}