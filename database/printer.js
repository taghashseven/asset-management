import { decapsulate } from "crypto";
import { db } from "../database/db.js";


export const getAllPrinters = async () => {
    try {
        const printers = await db.all(`
            SELECT * FROM printers
        `);

        for (const printer of printers) {
            printer.logs = await db.all(`
                SELECT
                    description,
                    event_type
                FROM printer_log
                WHERE printer_id = ?
            `, [printer.printer_id]);
        }

        return printers;
    } catch (error) {
        console.error(error);
        throw error;
    }
};


  // create a new printer
export const createPrinter = async (printerData) => {
    const { asset_tag, printer_name, brand, model,  IP_address, location, toner_code, } = printerData;

    try {
        const result = await db.run(
            `INSERT INTO printers (asset_tag, printer_name, brand, model,  IP_address, location, toner_code) 
             VALUES (?, ?, ?, ?, ?, ?, ? )`,
            [asset_tag, printer_name, brand, model, IP_address, location, toner_code ]
        );
        return result;
    }
    catch (error) {
        console.error("Error creating printer:", error);
        throw error;
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