import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import printerRoutes from "./printers/printerEndpoint.js";
import employeeRoutes from "./api/endpoint.js";
import assetRoutes from "./api/assetsEndPoint.js";
import assetEmployeeRoutes from "./api/assetEmployeeEndpoint.js";
import fs from "fs";
import db from "./database/db.js";
import monitorRoutes from "./api/monitorEndpoint.js";
import userMonitorRoutes from "./api/userMonitorEndpoint.js";
import viewEndpoints from "./api/viewEndpoints.js";
import authService  from "./admin/auth.endpoint.js";
import otherEquipment from "./api/otherEquipment.js";
import databaseApi from "./api/databaseApi.js"
import printerAPI from "./api/printerAPI.js"
// middlware 
import { authenticate } from "./middleware/auth.js";

// import "./database/migrate/importComputerAssets.js";
// import "./database/migrate/importEmployee.js";
// import "./database/migrate/importEmployeeComputerAsset.js";
// import "./database/migrate/importComputerfromExcel.js";
// import "./database/migrate/importMonitor.js";
// import "./database/migrate/importMonitorEmployee.js";   
// import "./database/migrate/importMonitorFromCSV.js"; // Import the CSV import script

import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = 3000;

// Replicate __dirname functionality because you are using ES Modules (import/export)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// console out all the end point that am hitting 
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    // if you want to log the body of POST requests, you can do so here
    if (req.method === "POST") {
        console.log("Request body:", req.body);
    }
    next();
});


// 1. Serve static assets out of the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// auth endpoint 
app.use("/api/auth", authService);

// 2. Mount API route
app.use("/api/printers", printerRoutes);

app.use("/api/print" , printerAPI)

// mount employee routes
app.use("/api/employees", employeeRoutes);

// mount asset routes
app.use("/api/assets", assetRoutes);

// mount monitor routes (if you have them, otherwise ignore this)
app.use("/api/monitors", monitorRoutes);

// mount user monitor routes
app.use("/api/usermonitors", userMonitorRoutes);

// mount employee_assignment routes
app.use("/api/assignments", assetEmployeeRoutes); 

// mount view endpoints
app.use("/api/views", viewEndpoints);

// other equipment 
app.use("/api/other-equipment" , otherEquipment )

app.use("/api/database-api" , databaseApi )

// 3. Fallback route: Serve index.html for any other directory root access
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "assets", "view.html"));
});

// 2. Strict Router Middleware for static files
app.use((req, res, next) => {
    let urlPath = req.path;

    // Handle root fallback straight away
    if (urlPath === "/") {
        urlPath = "/index.html";
    }

    // Check if the URL explicitly targets your allowed asset types
    if (urlPath.endsWith('.html') || urlPath.endsWith('.js') || urlPath.endsWith('.css') || urlPath.endsWith('.jpg') || urlPath.endsWith('.png') || urlPath.endsWith('.ico') || urlPath.endsWith('.jpeg') || urlPath.endsWith('.pdf')) {
        // Map the URL path directly to your local file system root
        const filePath = path.join(__dirname, urlPath);

        // Verify the file actually exists on disk before attempting to serve it
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).send('File Not Found');
        }
    }

    // Deny access to any backend files (.js files are allowed above, but only if they exist in the paths requested)
    res.status(403).send('Access Denied');
});

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});