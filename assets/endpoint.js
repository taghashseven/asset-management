import express from "express";
import * as Employee from "../database/employee.js";

const router = express.Router();

/**
 * GET all employees
 */
router.get("/", async (req, res) => {
  try {
    const results = await Employee.getAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET employee by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Employee.getById(id);

    if (!result) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * upsert employee (create or update)
 */
router.post("/", async (req, res) => {
  console.log("Received employee data:", req.body); // Log the incoming request body for debugging
  try {
    const result = await Employee.upsert(req.body);

    res.status(201).json({
      message: "Employee upserted successfully",

      id: result.lastID
    });
  } catch (err) {
    console.error("Error upserting employee:", err); // Log the error for debugging
    res.status(500).json({ error: err.message });
  }
});



/**
 * DELETE employee
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Employee.remove(id);

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// forms end point 
router.get("/forms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const forms = await Employee.getAllEmployeeForms(id);
    res.json(forms);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}) , 

// create a new form for an employee
router.post("/forms/create", async (req, res) => {
  try {
    console.log("Creating form with data:", req.body);
    const formId = await Employee.uploadEmployeeForm(req.body.employee_id , req.body.file_path);
    res.status(201).json({ id: formId });
  } catch (err) {
    console.error("Error creating form:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * HELP route (like your printer example)
 */
router.get("/help", (req, res) => {
  res.send("Employee API is running. Use /api/employees");
});

export default router;