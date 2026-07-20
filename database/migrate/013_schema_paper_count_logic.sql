-- 1. Ensure printers table has the page_count column
ALTER TABLE printers ADD COLUMN page_count INTEGER NOT NULL DEFAULT 0;


-- 2. Fixed spelling to "toner_stock" 
CREATE TABLE IF NOT EXISTS toner_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toner_code TEXT NOT NULL UNIQUE,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0) -- Prevents negative stock
);


-- 3. Recreate printer_log with fixed foreign key and validation
DROP TABLE IF EXISTS printer_log;
CREATE TABLE printer_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('TONER_REPLACEMENT', 'SERVICE', 'REPAIR', 'GENERAL', 'ERROR')
    ),
    toner_code TEXT, -- Standardized spelling
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE,
    FOREIGN KEY (toner_code) REFERENCES toner_stock(toner_code),
    
    -- Business Rule: Enforce that toner_code is provided IF AND ONLY IF it's a replacement
    CHECK (
        (event_type = 'TONER_REPLACEMENT' AND toner_code IS NOT NULL) OR 
        (event_type != 'TONER_REPLACEMENT' AND toner_code IS NULL)
    )
);


-- 4. Toner history table (Fixed spelling)
CREATE TABLE IF NOT EXISTS printer_toner_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    toner_code TEXT NOT NULL,
    initial_page_count INTEGER NOT NULL DEFAULT 0,
    final_page_count INTEGER,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE,
    FOREIGN KEY (toner_code) REFERENCES toner_stock(toner_code)
);


-- 5. Enhanced Trigger: Handles history AND decrements stock inventory
DROP TRIGGER IF EXISTS update_tonner_history; -- drop old trigger name

CREATE TRIGGER IF NOT EXISTS trg_printer_toner_replacement
AFTER INSERT ON printer_log
WHEN NEW.event_type = 'TONER_REPLACEMENT'
BEGIN
    
    -- A. Close out the final_page_count of the previous active toner
    UPDATE printer_toner_history
    SET final_page_count = (SELECT page_count FROM printers WHERE printer_id = NEW.printer_id)
    WHERE printer_id = NEW.printer_id AND final_page_count IS NULL;

    -- B. Insert the new toner tracking entry
    INSERT INTO printer_toner_history (printer_id, toner_code, initial_page_count)
    VALUES (
        NEW.printer_id, 
        NEW.toner_code, 
        (SELECT page_count FROM printers WHERE printer_id = NEW.printer_id)
    );

    -- C. AUTOMATION: Reduce the stock level by 1 for the used toner
    UPDATE toner_stock
    SET quantity = quantity - 1
    WHERE toner_code = NEW.toner_code;

END;