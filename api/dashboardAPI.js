

import express from "express";
import db from "../database/db.js";

const router = express.Router();

/**
 * GET Database Summary Schema
 */
router.get("/", async (req, res) => {
  try {
    const results = await getDatabaseSummary();
    res.json(results);
  } catch (err) {
    console.error("[DB Error] Schema summary failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});



export default router; 