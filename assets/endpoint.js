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
 * CREATE employee
 */
router.post("/", async (req, res) => {
  try {
    const result = await Employee.create(req.body);

    res.status(201).json({
      message: "Employee created",
      id: result.lastID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE employee
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Employee.update(id, req.body);

    res.json({ message: "Employee updated" });
  } catch (err) {
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

/**
 * HELP route (like your printer example)
 */
router.get("/help", (req, res) => {
  res.send("Employee API is running. Use /api/employees");
});

export default router;