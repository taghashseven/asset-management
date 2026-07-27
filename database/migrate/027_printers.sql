PRAGMA foreign_keys = OFF;

-- ============================================================================
-- 1. DROP ALL OLD/LEGACY VIEWS, TRIGGERS, AND TABLES
-- ============================================================================

-- Drop Views
DROP VIEW IF EXISTS v_toner_performance_stats;
DROP VIEW IF EXISTS v_toner_stock_alerts;

-- Drop Triggers
DROP TRIGGER IF EXISTS trg_sync_toner_page_count;
DROP TRIGGER IF EXISTS trg_toner_replacement_event;

-- Drop Tables (Legacy inventory & relationship tables first, then core tables)
DROP TABLE IF EXISTS printer_toners;
DROP TABLE IF EXISTS printer_supported_toners;
DROP TABLE IF EXISTS toner_aliases;
DROP TABLE IF EXISTS toner_stock;
DROP TABLE IF EXISTS printer_toner_history;
DROP TABLE IF EXISTS printer_log;
DROP TABLE IF EXISTS printer_images;
DROP TABLE IF EXISTS printers;

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 2. CREATE CLEAN TABLES
-- ============================================================================

-- Printers Table
CREATE TABLE printers (
    printer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag TEXT UNIQUE,
    printer_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    ip_address TEXT,
    mac_address TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (
        status IN ('Active', 'Inactive', 'Retired', 'Standby')
    ),
    is_color INTEGER NOT NULL DEFAULT 0,
    page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
    location TEXT,
    purchase_date DATE
);

-- Printer Images Table
CREATE TABLE printer_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE
);

-- Event Log Table (Simple SNMP or manual swap logging)
CREATE TABLE printer_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('TONER_REPLACEMENT', 'SERVICE', 'REPAIR', 'GENERAL', 'ERROR')
    ),
    toner_name TEXT, -- Flexible text string (e.g. "151A", "Black HP 151", "Cyan")
    color TEXT DEFAULT 'Black' CHECK (
        color IN ('Black', 'Cyan', 'Magenta', 'Yellow', 'Other')
    ),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE,
    
    CHECK (
        (event_type = 'TONER_REPLACEMENT' AND toner_name IS NOT NULL) OR 
        (event_type != 'TONER_REPLACEMENT')
    )
);

-- Toner Lifecycle Tracker Table
CREATE TABLE printer_toner_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    toner_name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'Black',
    initial_page_count INTEGER NOT NULL DEFAULT 0,
    final_page_count INTEGER,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    removed_at DATETIME,
    
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. AUTOMATION TRIGGERS
-- ============================================================================

-- Trigger: Automatically closes the active toner for a given color and starts a new lifecycle session
CREATE TRIGGER trg_toner_replacement_event
AFTER INSERT ON printer_log
WHEN NEW.event_type = 'TONER_REPLACEMENT'
BEGIN
    -- 1. Close active session for THIS SPECIFIC COLOR on this printer
    UPDATE printer_toner_history
    SET final_page_count = (SELECT page_count FROM printers WHERE printer_id = NEW.printer_id),
        removed_at = CURRENT_TIMESTAMP
    WHERE printer_id = NEW.printer_id 
      AND color = NEW.color 
      AND removed_at IS NULL;

    -- 2. Open new lifecycle session
    INSERT INTO printer_toner_history (
        printer_id, 
        toner_name, 
        color, 
        initial_page_count
    )
    VALUES (
        NEW.printer_id, 
        NEW.toner_name, 
        NEW.color, 
        (SELECT page_count FROM printers WHERE printer_id = NEW.printer_id)
    );
END;

-- Trigger: Auto-sync active toner final_page_count whenever printer page_count updates (e.g., via SNMP)
CREATE TRIGGER trg_sync_toner_page_count
AFTER UPDATE OF page_count ON printers
BEGIN
    UPDATE printer_toner_history
    SET final_page_count = NEW.page_count
    WHERE printer_id = NEW.printer_id AND removed_at IS NULL;
END;

-- ============================================================================
-- 4. VIEWS
-- ============================================================================

-- Single unified view for page counts, color channels, and active days per toner
CREATE VIEW v_toner_performance_stats AS
SELECT 
    pth.id AS history_id,
    p.printer_id,
    p.printer_name,
    p.model AS printer_model,
    pth.toner_name,
    pth.color,
    pth.installed_at,
    pth.removed_at,
    pth.initial_page_count,
    COALESCE(pth.final_page_count, p.page_count) AS current_or_final_page_count,
    (COALESCE(pth.final_page_count, p.page_count) - pth.initial_page_count) AS total_pages_printed,
    ROUND(
        JULIANDAY(COALESCE(pth.removed_at, CURRENT_TIMESTAMP)) - JULIANDAY(pth.installed_at), 
        1
    ) AS days_in_use
FROM printer_toner_history pth
JOIN printers p ON p.printer_id = pth.printer_id;