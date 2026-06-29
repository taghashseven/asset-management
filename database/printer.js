import { db } from "../database/db.js";

export default class PrinterModel {

  static async getAll() {
    return db.all(`
      SELECT *
      FROM printers
    `);
  }

  static async create(printer) {

    const result = await db.run(
      `
      INSERT INTO printers
      (
        asset_tag,
        printer_name,
        brand,
        model,
        serial_number,
        location,
        status,
        is_color
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        printer.asset_tag,
        printer.printer_name,
        printer.brand,
        printer.model,
        printer.serial_number,
        printer.location,
        printer.status,
        printer.is_color
      ]
    );

    return result.lastID;
  }
}