-- =====================================================
-- SCHEMA VERSION
-- =====================================================

PRAGMA user_version = 2;

PRAGMA foreign_keys = ON;



-- =====================================================
-- EMPLOYEES
-- =====================================================

CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,

    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    department TEXT,
    job_title TEXT,
    active INTEGER NOT NULL DEFAULT 1
);

-- =====================================================
-- COMPUTER ASSETS
-- =====================================================

CREATE TABLE computer_assets (
    asset_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_number TEXT UNIQUE,
    serial_number TEXT NOT NULL UNIQUE,

    device_type TEXT NOT NULL,

    brand TEXT,
    model TEXT,

    eth_mac_addr TEXT,
    wifi_mac_addr TEXT,

    bitlocker_key TEXT,

    purchase_date DATE,


    status TEXT NOT NULL DEFAULT 'Available'
    CHECK (
        status IN (
            'Available',
            'Assigned',
            'Repair',
            'Retired'
        )
    ),

    specs TEXT,
    location TEXT
);

-- =====================================================
-- COMPUTER ASSIGNMENTS
-- =====================================================

CREATE TABLE asset_assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    serial_number TEXT NOT NULL,
    employee_email TEXT NOT NULL,

    date_issued DATE,
    date_returned DATE,

    notes TEXT,

    CHECK (
        date_returned IS NULL
        OR date_returned >= date_issued
    ),

    FOREIGN KEY(serial_number)
        REFERENCES computer_assets(serial_number)
        ON DELETE RESTRICT,

    FOREIGN KEY(employee_email)
        REFERENCES employees(email)
        ON DELETE RESTRICT
);

-- Only one active assignment per asset

CREATE UNIQUE INDEX idx_asset_active_assignment
ON asset_assignments(serial_number)
WHERE date_returned IS NULL;

-- =====================================================
-- MONITORS
-- =====================================================

CREATE TABLE monitors (
    monitor_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_number TEXT,
    serial_number TEXT NOT NULL UNIQUE,

    brand TEXT,
    model TEXT,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'Available'
    CHECK (
        status IN (
            'Available',
            'Assigned',
            'Repair',
            'Retired'
            -- please add standby 
        )
    ),

    notes TEXT,

    purchase_date DATE,
    location TEXT
);

-- =====================================================
-- MONITOR ASSIGNMENTS
-- =====================================================

CREATE TABLE monitor_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    monitor_serial_number TEXT NOT NULL,
    employee_email TEXT NOT NULL,

    date_issued DATE,
    date_returned DATE,

    notes TEXT,

    CHECK (
        date_returned IS NULL
        OR date_returned >= date_issued
    ),

    FOREIGN KEY(monitor_serial_number)
        REFERENCES monitors(serial_number)
        ON DELETE RESTRICT,

    FOREIGN KEY(employee_email)
        REFERENCES employees(email)
        ON DELETE RESTRICT
);

-- Only one active assignment per monitor

CREATE UNIQUE INDEX idx_monitor_active_assignment
ON monitor_assignments(monitor_serial_number)
WHERE date_returned IS NULL;

-- =====================================================
-- PRINTERS
-- =====================================================

CREATE TABLE printers (
    printer_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_tag TEXT  UNIQUE,
    printer_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    ip_address TEXT,
    mac_address TEXT,

    status TEXT NOT NULL DEFAULT 'Active'
    CHECK (
        status IN (
            'Active',
            'Inactive',
            'Retired' ,
            'standby'
        )
    ),

    is_color INTEGER NOT NULL DEFAULT 0,
    page_count INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    purchase_date DATE,
    toner_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVER ROOM ASSETS
-- =====================================================

CREATE TABLE server_room_assets (
    server_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_number TEXT NOT NULL UNIQUE,

    asset_type TEXT NOT NULL,

    computer_name TEXT,

    manufacturer TEXT,
    model TEXT,

    serial_number TEXT UNIQUE,

    specs TEXT,

    description TEXT,

    rack_location TEXT,

    ip_address TEXT,

    purchase_date DATE,

    status TEXT NOT NULL DEFAULT 'Active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ASSET LOGS
-- =====================================================

CREATE TABLE asset_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_id INTEGER NOT NULL,

    action TEXT NOT NULL,

    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(asset_id)
        REFERENCES computer_assets(asset_id)
        ON DELETE CASCADE
);




-- =====================================================
-- CURRENT COMPUTER ASSIGNMENTS VIEW
-- =====================================================

CREATE VIEW current_asset_assignments AS
SELECT
    aa.assignment_id,

    e.employee_id,
    e.email,
    e.first_name,
    e.last_name,

    ca.asset_id,
    ca.asset_number,
    ca.serial_number,
    ca.device_type,

    aa.date_issued
FROM asset_assignments aa
INNER JOIN employees e
    ON e.email = aa.employee_email
INNER JOIN computer_assets ca
    ON ca.serial_number = aa.serial_number
WHERE aa.date_returned IS NULL;

-- =====================================================
-- CURRENT MONITOR ASSIGNMENTS VIEW
-- =====================================================

CREATE VIEW current_monitor_assignments AS
SELECT
    ma.id,

    e.employee_id,
    e.email,
    e.first_name,
    e.last_name,

    m.monitor_id,
    m.asset_number,
    m.serial_number,

    ma.date_issued
FROM monitor_assignments ma
INNER JOIN employees e
    ON e.email = ma.employee_email
INNER JOIN monitors m
    ON m.serial_number = ma.monitor_serial_number
WHERE ma.date_returned IS NULL; 