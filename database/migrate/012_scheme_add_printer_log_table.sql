
-- log table for printer events 
-- 

CREATE TABLE IF NOT EXISTS printer_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    printer_id INTEGER NOT NULL,

    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'TONER_REPLACEMENT',
            'SERVICE',
            'REPAIR',
            'GENERAL',
            'ERROR'
        )
    ),

    description TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (printer_id)
        REFERENCES printers(printer_id)
        ON DELETE CASCADE
);

