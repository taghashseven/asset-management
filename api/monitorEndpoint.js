import express from "express";
import {
  getAllMonitors,
  createMonitor,
  upsertMonitor
} from "../database/monitor.js";

const router = express.Router();

/**
 * GET all monitors
 */
router.get("/", async (req, res) => {
  try {
    const results = await getAllMonitors();
    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/**
 * CREATE monitor
 */
router.post("/", async (req, res) => {
  try {
    const monitorId = await upsertMonitor(req.body);

    res.status(201).json({
      success: true,
      monitorId
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// put 
router.put("/", async (req, res) => {
  try {
    const monitorId = await upsertMonitor(req.body);
    res.json({
      success: true,
      monitorId
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


/**
 * HELP
 */
router.get("/help", (req, res) => {
  res.send(`
Available endpoints:

GET    /
POST   /
  `);
});

export default router;