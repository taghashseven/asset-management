import express from "express";
import {
  assignMonitor,
  getAllMonitorAssignments
} from "../database/monitorAssignement.js";

const router = express.Router();

/**
 * GET all monitors
 */
router.get("/", async (req, res) => {
  try {
    const results = await getAllMonitorAssignments();
    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// GET all monitor assignments
router.get("/assignments", async (req, res) => {
    try {
        const results = await assignMonitor();
        res.json(results);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// create a monitor assignment
router.post("/", async (req, res) => {
    try {
        console.log("Request body for monitor assignment:", req.body);
        const assignmentId = await assignMonitor(req.body);
        res.status(201).json({
            success: true,
            assignmentId
        });
    }
    catch (err) {
        console.error("Error assigning monitor:", err);
        res.status(500).json({
            error: err.message
        });
    }
}) ; 

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