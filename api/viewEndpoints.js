import express from "express";
import {
  getUserMonitorsAndAssets,
  getUnassignedComputers , 
  getUnassignedMonitors,
  getEmployeeDetails,
  getAssetDetails,
  transferAsset,
  getSystemAlerts
} from "../database/view.js";

import {createEmployeeForms} from "../database/form.js"

const router = express.Router();

router.get("/alerts", async (req, res) => {
  try {
    res.json(await getSystemAlerts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/employees/:id", async (req, res) => {
  try {
    const details = await getEmployeeDetails(req.params.id);
    if (!details) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assets/:type/:serialNumber", async (req, res) => {
  try {
    const details = await getAssetDetails(req.params.type, req.params.serialNumber);
    if (!details) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json(details);
  } catch (err) {
    const status = err.message === "Unsupported resource type" ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post("/assets/transfer", async (req, res) => {
  try {
    const { type, serial_number: serialNumber, employee_email: employeeEmail, notes } = req.body;
    const result = await transferAsset({ type, serialNumber, employeeEmail, notes });
    res.json({ success: true, ...result });
  } catch (err) {
    const clientErrors = [
      "Unsupported resource type",
      "A serial number is required",
      "Resource not found",
      "Employee not found",
      "Cannot assign resources to an inactive employee",
      "Resource is already assigned to this employee"
    ];
    res.status(clientErrors.includes(err.message) ? 400 : 500).json({ error: err.message });
  }
});

/**
 * GET /user-monitors-assets
 * Description: Get all employees along with their assigned monitors and assets
 */
router.get("/", async (req, res) => {
  try {
    const results = await getUserMonitorsAndAssets();
    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// computes not assigned to any employee
router.get("/unassigned", async (req, res) => {
  try {
    const results = await getUnassignedComputers();
    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


// monitors not assigned to any employee
router.get("/unassigned-monitors", async (req, res) => {
    try {
        const results = await getUnassignedMonitors();
        res.json(results);
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// create a from based on the user info
router.post("/" , async(req , res) => {
    // if it has form add the form 
    const body = req.body  
    if(req.body.forms){
        createEmployeeForms(body)
    }

    return res.status(201)
})


export default router;