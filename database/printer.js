import { db } from "../database/db.js";
import path from 'path';
import fs from 'fs/promises';



export const getAllPrinters = async () => {
    try {
        const printers = await db.all(`SELECT * FROM printers`);

        if (printers.length === 0) return [];

        const printerIds = printers.map(p => p.printer_id);
        const placeholders = printerIds.map(() => '?').join(',');

        // Fetch all relevant logs and images in batch
        const [allLogs, allImages] = await Promise.all([
            db.all(`
                SELECT printer_id, description, event_type
                FROM printer_log
                WHERE printer_id IN (${placeholders})
            `, printerIds),

            db.all(`
                SELECT image_id, printer_id, image_path
                FROM printer_images
                WHERE printer_id IN (${placeholders})
            `, printerIds)
        ]);

        // Map logs and images back to their respective printers
        return printers.map(printer => ({
            ...printer,
            logs: allLogs.filter(log => log.printer_id === printer.printer_id),
            images: allImages.filter(img => img.printer_id === printer.printer_id)
        }));

    } catch (error) {
        console.error("Failed to fetch printers batch:", error);
        throw error;
    }
};



export async function upsertPrinter(printer) {
  console.log("Upserting printer:", printer);

  // ----------------------------
  // Sanitize Inputs
  // ----------------------------
  const printerId = Number(printer.printer_id) || null;
  const assetTag = printer.asset_tag?.trim() || null;
  const printerName = printer.printer_name?.trim();

  if (!printerName) {
    throw new Error("Printer name is required.");
  }

  const brand = printer.brand?.trim() || null;
  const model = printer.model?.trim() || null;
  const serialNumber = printer.serial_number?.trim() || null;
  const ipAddress = (printer.ip_address || printer.IP_address)?.trim() || null;
  const macAddress = printer.mac_address?.trim() || null;
  const location = printer.location?.trim() || null;
  const purchaseDate = printer.purchase_date?.trim() || null;

  const pageCount = Number.parseInt(printer.page_count, 10);
  const safePageCount = Number.isNaN(pageCount) ? 0 : pageCount;

  const isColor = printer.is_color ? 1 : 0;
  const status = printer.status || "Active";

  try {
    await db.exec("BEGIN TRANSACTION");

    let id = printerId;

    // =====================================
    // UPDATE
    // =====================================
    if (id) {
      const result = await db.run(
        `
        UPDATE printers
        SET
          asset_tag = ?,
          printer_name = ?,
          brand = ?,
          model = ?,
          serial_number = ?,
          ip_address = ?,
          mac_address = ?,
          status = ?,
          is_color = ?,
          page_count = ?,
          location = ?,
          purchase_date = ?
        WHERE printer_id = ?
        `,
        [
          assetTag,
          printerName,
          brand,
          model,
          serialNumber,
          ipAddress,
          macAddress,
          status,
          isColor,
          safePageCount,
          location,
          purchaseDate,
          id,
        ]
      );

      if (result.changes === 0) {
        throw new Error(`Printer ID ${id} does not exist.`);
      }
    }

    // =====================================
    // INSERT
    // =====================================
    else {
      const result = await db.run(
        `
        INSERT INTO printers (
          asset_tag,
          printer_name,
          brand,
          model,
          serial_number,
          ip_address,
          mac_address,
          status,
          is_color,
          page_count,
          location,
          purchase_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          assetTag,
          printerName,
          brand,
          model,
          serialNumber,
          ipAddress,
          macAddress,
          status,
          isColor,
          safePageCount,
          location,
          purchaseDate,
        ]
      );

      id = result.lastID;
    }

    // =====================================
    // Save Images
    // =====================================
    if (Array.isArray(printer.images) && printer.images.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "printers");

      await fs.mkdir(uploadDir, { recursive: true });

      for (const img of printer.images) {
        if (!img?.string || !img?.filename) continue;

        const ext = path.extname(img.filename) || ".jpg";

        const filename = `printer_${id}_${Date.now()}_${Math.floor(
          Math.random() * 1000000
        )}${ext}`;

        const absolutePath = path.join(uploadDir, filename);

        // URL stored in database
        const relativePath = `/printers/${filename}`;

        const base64 = img.string.replace(
          /^data:image\/[a-zA-Z]+;base64,/,
          ""
        );

        await fs.writeFile(
          absolutePath,
          Buffer.from(base64, "base64")
        );

        await db.run(
          `
          INSERT INTO printer_images (
            printer_id,
            image_path
          )
          VALUES (?, ?)
          `,
          [id, relativePath]
        );
      }
    }

    await db.exec("COMMIT");

    return id;
  } catch (err) {
    await db.exec("ROLLBACK");

    console.error("Printer upsert failed:", err);

    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error(
        "The asset tag or serial number already exists."
      );
    }

    if (err.code === "SQLITE_CONSTRAINT_NOTNULL") {
      throw new Error("A required field is missing.");
    }

    throw err;
  }
}

// get all toner stock data
export const getAllTonerStock = async () => {
    try {
        const tonerStock = await db.all("SELECT * FROM toner_stock");
        return tonerStock;
    }
    catch (error) {
        console.error("Error fetching toner stock:", error);
        throw error;
    }
}

// create a new toner stock entry
export const createTonerStock = async (tonerData) => {
    const { toner_code, description, quantity } = tonerData;

    try {
        const result = await db.run(
            `INSERT INTO toner_stock (toner_code, description, quantity)
                VALUES (?, ?, ?)`,
            [toner_code, description , quantity]
        );
        return result;
    }
    catch (error) {
        console.error("Error creating toner stock:", error);
        throw error;
    }

}


//  about printer by id
export const getPrinterById = async (printerId) => {
    try {
        const printer = await db.get("SELECT * FROM printers WHERE id = ?", [printerId]);
        return printer;
    }
    catch (error) {
        console.error("Error fetching printer by ID:", error);
        throw error;
    }
}

//update
export const updatePrinter = async (printerId, updateData) => {

    const { asset_tag, printer_name, brand, model, ip_address, location, toner_code } = updateData;

    try {
        const result = await db.run(
            `UPDATE printers SET asset_tag = ?, printer_name = ?, brand = ?, model = ?, ip_address = ?, location = ?, toner_code = ? WHERE printer_id = ?`,
            [asset_tag, printer_name, brand, model, ip_address, location, toner_code, printerId]
        );
        console.log("Printer updated successfully:", result);
        return result;
    }

    catch (error) {
        console.error("Error updating printer:", error);
        throw error;
    }
    
}


// printer logs
export const getPrinterLogs = async (printerId) => {
    try {
        const logs = await db.all("SELECT * FROM printer_log WHERE printer_id = ?", [printerId]);
        return logs;    

    }
    catch (error) {
        console.error("Error fetching printer logs:", error);
        throw error;
    }
}

export const createPrinterLog = async (printerId, logData) => {
    const { description, event_type } = logData;

    try {
        const result = await db.run(
            `INSERT INTO printer_log (printer_id, description, event_type) VALUES (?, ?, ?)`,
            [printerId, description, event_type]
        );
        return result;
    }
    catch (error) {
        console.error("Error creating printer log entry:", error);
        throw error;
    }
}


export const deletePrinter = async (printerId) => {
    try {
        // 1. Fetch images to locate physical files on disk before DB records are deleted
        const images = await db.all(
            `SELECT image_path FROM printer_images WHERE printer_id = ?`,
            [printerId]
        );

        // 2. Remove physical image files from disk
        for (const img of images) {
            if (!img.image_path) continue;

            // Strip leading slash if present so path.join resolves relative to root directory
            const cleanRelativePath = img.image_path.replace(/^\//, '');
            const absolutePath = path.join(process.cwd(), cleanRelativePath);

            await fs.unlink(absolutePath).catch((err) => {
                console.warn(`Could not delete file ${absolutePath}:`, err.message);
            });
        }

        // 3. Delete database records (images, logs, and main printer entry)
        await db.run(`DELETE FROM printer_images WHERE printer_id = ?`, [printerId]);
        await db.run(`DELETE FROM printer_log WHERE printer_id = ?`, [printerId]);
        
        const result = await db.run(`DELETE FROM printers WHERE printer_id = ?`, [printerId]);

        return {
            success: true,
            message: `Printer ${printerId} and all associated logs and images deleted successfully.`,
            changes: result.changes
        };
    } catch (error) {
        console.error(`Error deleting printer ${printerId}:`, error);
        throw error;
    }
};