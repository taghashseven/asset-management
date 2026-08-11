import express from "express";
import { getPrinterData } from "./scanprinters.js";

import { getAllPrinters, 
        upsertPrinter , 
        createTonerStock, 
        getAllTonerStock, 
        getPrinterById  , 
        updatePrinter , 
        getPrinterLogs , 
        deletePrinter ,
        createPrinterLog , 
    } from "../database/printer.js"

const router = express.Router();

router.get("/", async  (req, res) => {

     console.log("Fetching printer data from the database...");

    let results = await getPrinterData()

    res.json(results);

});

router.get("/all" , async (req , res ) => {
    try {
        const printers = await getAllPrinters();
        res.json(printers);
    }
    catch (error) {
        console.error("Error fetching printers:", error);
        res.status(500).json({ error: "Failed to fetch printers" });
    }
}) 


// create printer 
router.post("/create" , async (req , res ) => {
    try {
        const result = await upsertPrinter(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error creating printer:", error);
        res.status(500).json({ error: "Failed to create printer" });
    }
})

// create printer 
router.post("/all" , async (req , res ) => {
    try {
        const result = await upsertPrinter(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error creating printer:", error);
        res.status(500).json({ error: "Failed to create printer" });
    }
})

// udpate printer
router.post("/update" , async (req , res ) => {
    try {
        const { printer_id, ...updateData } = req.body;
        const result = await upsertPrinter(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        console.log("error update the printer ::" , error.message)
    }
}) , 

router.get("/help" , async (req , res ) => {
    res.send("hello it help over her")
})


// toner stock routes
router.get("/toner-stock", async (req, res) => {
    try {
        const tonerStock = await getAllTonerStock();
        res.json(tonerStock);
    }
    catch (error) {
        console.error("Error fetching toner stock:", error);
        res.status(500).json({ error: "Failed to fetch toner stock" });
    }
});

router.post("/toner-stock/create", async (req, res) => {
    try {
        const result = await createTonerStock(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error creating toner stock entry:", error);
        res.status(500).json({ error: "Failed to create toner stock entry" });
    }
});


// about printers 
// should return a the details of a printer given its id 

router.get("/:id", async (req, res) => {
    try {
        const printer = await getPrinterById(req.params.id);
        if (printer) {
            res.json(printer);
        } else {
            res.status(404).json({ error: "Printer not found" });
        }
    }
    catch (error) {
        console.error("Error fetching printer details:", error);
        res.status(500).json({ error: "Failed to fetch printer details" });
    }
});


// printer logs 
router.get("/logs/:id", async (req, res) => {
    try {
        // Implement logic to fetch printer logs from the database or log files
        const id = req.params.id;
        const logs = await getPrinterLogs(id); // Placeholder function
        res.json(logs);
    }
    catch (error) {
        console.error("Error fetching printer logs:", error);
        res.status(500).json({ error: "Failed to fetch printer logs" });
    }
});

// create a new printer log entry
router.post("/logs/:printerId", async (req, res) => {
    try {
        const { printerId } = req.params;
        const logData = req.body;

        const result = await createPrinterLog(printerId, logData); // Placeholder function
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error creating printer log entry:", error);
        res.status(500).json({ error: "Failed to create printer log entry" });
    }
});


// delete printer 
router.delete("/:printerId" , async (req , res) => {
    try{
        const { printerId } = req.params;
        await deletePrinter(printerId)
        const printers = await getAllPrinters()
        res.json(printers)
    }
    catch(err){
        console.log("error : " , err.message)
        res.status(500).json({err : err.message})
    } 
})


export default router;
