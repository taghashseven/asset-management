import express from "express";
import db from "../database/db.js";
import { getDatabaseSummary } from "../database/databaseSummary.js";

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

/**
 * POST Execute Custom SQL Query
 */
router.post("/query", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "No SQL query provided." });
  }

  const trimmed = query.trim().toUpperCase();

  try {
    // If SELECT / PRAGMA / EXPLAIN query, return matching rows
    if (
      trimmed.startsWith("SELECT") ||
      trimmed.startsWith("PRAGMA") ||
      trimmed.startsWith("EXPLAIN")
    ) {
      const rows = await db.all(query);
      res.json(rows || []);
    } else {
      // For INSERT, UPDATE, DELETE, ALTER, etc.
      const result = await db.run(query);
      res.json({
        message: "Query executed successfully.",
        changes: result?.changes,
        lastID: result?.lastID,
      });
    }
  } catch (err) {
    console.error("[DB Query Error]:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST Fetch Data for Specific Table
 */
router.post("/table", async (req, res) => {
  const { tableName } = req.body;

  if (!tableName) {
    return res.status(400).json({ error: "Table name is required." });
  }

  // Sanitize table name to prevent SQL injection
  const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

  try {
    console.log(`[DB Query] Querying table: ${cleanTableName}`);
    const rows = await db.all(`SELECT * FROM ${cleanTableName} LIMIT 200`);
    
    console.log(`[DB Success] Retreived ${rows ? rows.length : 0} rows from ${cleanTableName}`);
    res.json(rows || []);
  } catch (err) {
    console.error(`[DB Error] Failed to fetch table ${cleanTableName}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;