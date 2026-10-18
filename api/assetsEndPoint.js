import express from "express";
import {
  getAllComputerAssets,
  getComputerAssetById,
  upsertComputerAsset,
  updateComputerAssetStatus , 
  deleteComputerAsset 
} from "../database/computerAsset.js";

const router = express.Router();

/**
 * GET all computer assets
 */
router.get("/", async (req, res) => {
  try {
    const results = await getAllComputerAssets();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET one computer asset by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const asset = await getComputerAssetById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        error: "Asset not found"
      });
    }

    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREATE / UPDATE asset
 */
router.post("/", async (req, res) => {
  try {
    console.log("-----------------------------------------");
    console.log("Received asset data:", req.body);
    const assetId = await upsertComputerAsset(req.body);


    res.json({
      success: true,
      assetId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE asset status
 */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    await updateComputerAssetStatus(
      req.params.id,
      status
    );

    res.json({
      success: true,
      message: "Status updated"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Help endpoint
 */
router.get("/help", (req, res) => {
  res.send(`
Available endpoints:

GET    /
GET    /:id
POST   /
PUT    /:id/status
  `);
});

// delete computer asset
router.delete("/:id"  ,async (req, res)=> {
  try{
     console.log("Deleting asset with ID:", req.params.id);
    const assetId = req.params.id;
    await deleteComputerAsset(assetId);
    res.json({ success: true, message: "Asset deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error deleting asset:", err);
  }
});

export default router;