
import express from "express";

import {
    getAllOtherEquipment , 
    upsertOtherEquipment
} from "../database/otherEquipment.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const results = await getAllOtherEquipment();
        res.json(results);
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// create / update other equipment
router.post("/", async (req, res) => {
    try {
        console.log("Request body for other equipment:", req.body);
        const equipmentId = await upsertOtherEquipment(req.body);
        res.status(201).json({
            success: true,
            equipmentId
        });
    }
    catch (err) {
        console.error("Error upserting other equipment:", err);
        res.status(500).json({
            error: err.message
        });
    }
    
});

export default router;