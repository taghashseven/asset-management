CREATE TABLE IF NOT EXISTS printer_toners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    toner_code TEXT NOT NULL,
    toner_level INTEGER NOT NULL,
    initial_page INTEGER NOT NULL,
    current_page INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (printer_id) REFERENCES printers(printer_id) ON DELETE CASCADE
);