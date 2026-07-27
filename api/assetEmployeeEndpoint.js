import express from "express";
import {
  createAssignment,
  getAllAssignments,
  getActiveAssignments,
  returnAssignment,
  deleteAssignment , 
  updateAssignment
} from "../database/assetAssignement.js";



const router = express.Router();

/**
 * GET all assignments
 */
router.get("/", async (req, res) => {
  try {
    const results = await getAllAssignments();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET active assignments
 */
router.get("/active", async (req, res) => {
  try {
    const results = await getActiveAssignments();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREATE assignment
 */
router.post("/", async (req, res) => {
  try {
    console.log("Creating assignment with data:", req.body);  
    const assignmentId = await createAssignment(req.body);

    res.status(201).json({
      success: true,
      assignmentId
    });
  } catch (err) {
    console.log("Error creating assignment:", err);
    res.status(500).json({ error: err.message });
  }
});

// update 
router.post("/update" , async (req, res) => {
  try {
    await updateAssignment(req.body.assignment_id, req.body);
    res.json({
      success: true,
      message: "Assignment updated successfully"
    });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * RETURN assigned asset
 */
router.put("/:id/return", async (req, res) => {
  try {
    await returnAssignment(req.params.id);

    res.json({
      success: true,
      message: "Asset returned successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE assignment
 */
router.delete("/:id", async (req, res) => {
  try {
    await deleteAssignment(req.params.id);

    res.json({
      success: true,
      message: "Assignment deleted"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * HELP
 */
router.get("/help", (req, res) => {
  res.send(`
      Available endpoints:

      GET    /
      GET    /active
      POST   /
      PUT    /:id/return
      DELETE /:id
    `);
});

export default router;