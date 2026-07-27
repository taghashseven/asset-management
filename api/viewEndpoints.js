import express from "express";
import {
  getUserMonitorsAndAssets,
  getUnassignedComputers , 
    getUnassignedMonitors , 
} from "../database/view.js";

import {createEmployeeForms} from "../database/form.js"

const router = express.Router();

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