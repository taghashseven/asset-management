import express from "express";
import db from "../database/db.js";
import { getDatabaseSummary } from "../database/databaseSummary.js";

const router = express.Router();

/**
 * GET Database Summary Schema
 */
router.get("/", async (req, res) => {
  try {
    const results = await getDatabaseSummary();
    res.json(results);
  } catch (err) {
    console.error("[DB Error] Schema summary failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST Execute Custom SQL Query
 */
router.post("/query", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "No SQL query provided." });
  }

  const trimmed = query.trim().toUpperCase();

  try {
    // If SELECT / PRAGMA / EXPLAIN query, return matching rows
    if (
      trimmed.startsWith("SELECT") ||
      trimmed.startsWith("PRAGMA") ||
      trimmed.startsWith("EXPLAIN")
    ) {
      const rows = await db.all(query);
      res.json(rows || []);
    } else {
      // For INSERT, UPDATE, DELETE, ALTER, etc.
      const result = await db.run(query);
      res.json({
        message: "Query executed successfully.",
        changes: result?.changes,
        lastID: result?.lastID,
      });
    }
  } catch (err) {
    console.error("[DB Query Error]:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST Fetch Data for Specific Table
 */
router.post("/table", async (req, res) => {
  const { tableName } = req.body;

  if (!tableName) {
    return res.status(400).json({ error: "Table name is required." });
  }

  // Sanitize table name to prevent SQL injection
  const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

  try {
    console.log(`[DB Query] Querying table: ${cleanTableName}`);
    const rows = await db.all(`SELECT * FROM ${cleanTableName} LIMIT 200`);
    
    console.log(`[DB Success] Retreived ${rows ? rows.length : 0} rows from ${cleanTableName}`);
    res.json(rows || []);
  } catch (err) {
    console.error(`[DB Error] Failed to fetch table ${cleanTableName}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});


router.get("/dashboard", async (req, res) => {
  try {
    // Execute concurrent DB queries for high performance
    const [
      employeeStats,
      computerStats,
      computerTypes,
      monitorStats,
      printerStats,
      tonerStats,
      serverStats
    ] = await Promise.all([
      // 1. Employees breakdown
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive
        FROM employees
      `),

      // 2. Computer assets assignment status (Active assignments have null date_returned)
      db.get(`
        SELECT 
          COUNT(c.asset_id) as total,
          COUNT(DISTINCT CASE WHEN a.date_returned IS NULL AND a.assignment_id IS NOT NULL THEN c.serial_number END) as assigned,
          SUM(CASE WHEN LOWER(c.status) = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN LOWER(c.status) IN ('maintenance', 'repair', 'broken') THEN 1 ELSE 0 END) as in_repair
        FROM computer_assets c
        LEFT JOIN asset_assignments a ON c.serial_number = a.serial_number AND a.date_returned IS NULL
      `),

      // 3. Computer breakdown by device type (Laptop, Desktop, Workstation, etc.)
      db.all(`
        SELECT device_type, COUNT(*) as count 
        FROM computer_assets 
        GROUP BY device_type 
        ORDER BY count DESC
      `),

      // 4. Monitor assets assignment status
      db.get(`
        SELECT 
          COUNT(m.monitor_id) as total,
          COUNT(DISTINCT CASE WHEN ma.date_returned IS NULL AND ma.id IS NOT NULL THEN m.serial_number END) as assigned,
          SUM(CASE WHEN LOWER(m.status) = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN LOWER(m.status) IN ('maintenance', 'repair', 'defective') THEN 1 ELSE 0 END) as in_repair
        FROM monitors m
        LEFT JOIN monitor_assignments ma ON m.serial_number = ma.monitor_serial_number AND ma.date_returned IS NULL
      `),

      // 5. Printers breakdown
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN LOWER(status) = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN LOWER(status) != 'active' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN is_color = 1 THEN 1 ELSE 0 END) as color_printers,
          SUM(CASE WHEN is_color = 0 THEN 1 ELSE 0 END) as mono_printers
        FROM printers
      `),

      // 6. Printers low toner warning (Toner level below 15%)
      db.get(`
        SELECT COUNT(*) as low_toner_count 
        FROM printer_toners 
        WHERE toner_level <= 15
      `),

      // 7. Server Room Assets breakdown
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN LOWER(status) = 'active' THEN 1 ELSE 0 END) as active
        FROM server_room_assets
      `)
    ]);

    // Format metrics response
    res.json({
      employees: {
        total: employeeStats.total || 0,
        active: employeeStats.active || 0,
        inactive: employeeStats.inactive || 0,
        activePercentage: employeeStats.total ? Math.round((employeeStats.active / employeeStats.total) * 100) : 0
      },
      computers: {
        total: computerStats.total || 0,
        assigned: computerStats.assigned || 0,
        available: computerStats.available || 0,
        inRepair: computerStats.in_repair || 0,
        unassigned: Math.max(0, (computerStats.total || 0) - (computerStats.assigned || 0)),
        utilizationRate: computerStats.total ? Math.round((computerStats.assigned / computerStats.total) * 100) : 0,
        byType: computerTypes || []
      },
      monitors: {
        total: monitorStats.total || 0,
        assigned: monitorStats.assigned || 0,
        available: monitorStats.available || 0,
        inRepair: monitorStats.in_repair || 0,
        unassigned: Math.max(0, (monitorStats.total || 0) - (monitorStats.assigned || 0)),
        utilizationRate: monitorStats.total ? Math.round((monitorStats.assigned / monitorStats.total) * 100) : 0
      },
      printers: {
        total: printerStats.total || 0,
        active: printerStats.active || 0,
        inactive: printerStats.inactive || 0,
        color: printerStats.color_printers || 0,
        monochrome: printerStats.mono_printers || 0,
        lowTonerAlerts: tonerStats.low_toner_count || 0
      },
      infrastructure: {
        serverAssets: serverStats.total || 0,
        activeServerAssets: serverStats.active || 0
      }
    });
  } catch (err) {
    console.error("[DB Error] Granular dashboard summary failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/**
 * GET Dynamic Relationship Graph API Endpoint
 * Traverses relationships across Users/Employees, Computer Assets, Monitors, Printers, and Logs.
 */
router.get("/graph-overview", async (req, res) => {
  try {
    const { status, entityType } = req.query; // Optional filters: ?status=inactive or ?entityType=employees

    // Concurrent DB fetches for all relational entities
    const [
      employees,
      computers,
      computerAssignments,
      monitors,
      monitorAssignments,
      printers,
      tonerLogs
    ] = await Promise.all([
      db.all("SELECT employee_id, email, first_name, last_name, department, active FROM employees"),
      db.all("SELECT asset_id, serial_number, device_type, brand, model, status FROM computer_assets"),
      db.all("SELECT assignment_id, serial_number, employee_email, date_issued, date_returned FROM asset_assignments WHERE date_returned IS NULL"),
      db.all("SELECT monitor_id, serial_number, brand, model, status FROM monitors"),
      db.all("SELECT id, monitor_serial_number, employee_email, date_issued, date_returned FROM monitor_assignments WHERE date_returned IS NULL"),
      db.all("SELECT printer_id, printer_name, ip_address, status FROM printers"),
      db.all("SELECT id, printer_id, toner_code, toner_level FROM printer_toners")
    ]);

    const nodes = [];
    const links = [];

    // Build Employee Nodes
    employees.forEach((emp) => {
      const isInactive = emp.active === 0 || emp.active === "false";
      nodes.push({
        id: `emp_${emp.email}`,
        label: `${emp.first_name} ${emp.last_name}`,
        type: "Employee",
        status: isInactive ? "Inactive" : "Active",
        details: emp
      });
    });

    // Build Computer Nodes & Active Assignment Links
    computers.forEach((pc) => {
      nodes.push({
        id: `pc_${pc.serial_number}`,
        label: `${pc.brand || ''} ${pc.model || pc.device_type}`,
        type: "Computer",
        status: pc.status,
        details: pc
      });
    });

    computerAssignments.forEach((assign) => {
      links.push({
        source: `emp_${assign.employee_email}`,
        target: `pc_${assign.serial_number}`,
        relationship: "ASSIGNED_COMPUTER",
        date_issued: assign.date_issued
      });
    });

    // Build Monitor Nodes & Active Assignment Links
    monitors.forEach((m) => {
      nodes.push({
        id: `mon_${m.serial_number}`,
        label: `${m.brand || ''} ${m.model || 'Monitor'}`,
        type: "Monitor",
        status: m.status,
        details: m
      });
    });

    monitorAssignments.forEach((assign) => {
      links.push({
        source: `emp_${assign.employee_email}`,
        target: `mon_${assign.monitor_serial_number}`,
        relationship: "ASSIGNED_MONITOR",
        date_issued: assign.date_issued
      });
    });

    // Build Printer & Toner Nodes/Links
    printers.forEach((p) => {
      nodes.push({
        id: `print_${p.printer_id}`,
        label: p.printer_name,
        type: "Printer",
        status: p.status,
        details: p
      });
    });

    tonerLogs.forEach((t) => {
      const tonerNodeId = `toner_${t.id}`;
      nodes.push({
        id: tonerNodeId,
        label: `${t.toner_code} (${t.toner_level}%)`,
        type: "Toner",
        status: t.toner_level <= 15 ? "Warning" : "OK",
        details: t
      });
      links.push({
        source: `print_${t.printer_id}`,
        target: tonerNodeId,
        relationship: "HAS_TONER"
      });
    });

    // Optional Filter application
    let filteredNodes = nodes;
    if (status) {
      filteredNodes = nodes.filter((n) => String(n.status).toLowerCase() === String(status).toLowerCase());
    }

    res.json({
      summary: {
        totalNodes: nodes.length,
        totalConnections: links.length
      },
      nodes: filteredNodes,
      links
    });
  } catch (err) {
    console.error("[DB Graph Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
});




export default router;