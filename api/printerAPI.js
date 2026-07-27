import express from "express";
import {
    getAllPrinters,
    getPrinterById,
    upsertPrinter,
    deletePrinter,
    updatePrinterPageCount,
    createPrinterLog,
    getPrinterLogs,
    getPrinterTonerStats
} from "../database/databasePrinters.js";

const router = express.Router();

// Fetch database printers, execute active network scan, process metrics & return list
router.get("/all", async (req, res) => {
    try {
        const printers = await getAllPrinters();
        res.json(printers);
    } catch (error) {
        console.error("Error executing printer scan and fetch:", error);
        res.status(500).json({ error: "Failed to scan and fetch printer data from database" });
    }
});

// FIXME this should read as updsert not /all 
// its a resul of quick fix 
router.post("/all", async (req, res) => {
    try {
        const result = await upsertPrinter(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const printer = await getPrinterById(req.params.id);
        if (!printer) return res.status(404).json({ error: "Printer not found" });
        res.json(printer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await deletePrinter(req.params.id);
        const printers = await getAllPrinters();
        res.json(printers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/:id/page-count", async (req, res) => {
    try {
        const { page_count } = req.body;
        if (page_count === undefined) {
            return res.status(400).json({ error: "page_count required in body" });
        }
        const result = await updatePrinterPageCount(req.params.id, page_count);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------------------------------------------------------------
// INVENTORY & STOCK ALERTS
// ----------------------------------------------------------------------------




// ----------------------------------------------------------------------------
// PRINTER LOGS & METRICS
// ----------------------------------------------------------------------------

router.get("/logs/:printerId", async (req, res) => {
    try {
        const logs = await getPrinterLogs(req.params.printerId);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/logs/:printerId", async (req, res) => {
    try {
        const result = await createPrinterLog(req.params.printerId, req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/stats/:printerId", async (req, res) => {
    try {
        const stats = await getPrinterTonerStats(req.params.printerId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;