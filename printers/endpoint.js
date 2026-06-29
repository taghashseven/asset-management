import express from "express";
import { getPrinterData } from "./scanprinters.js";

const router = express.Router();

router.get("/", async  (req, res) => {

    let results = await getPrinterData()

    res.json(results);

});

router.get("/help" , async (req , res ) => {
    res.send("hello it help over her")
})


export default router;
