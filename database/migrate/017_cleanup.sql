DROP TABLE IF EXISTS printers;

CREATE TABLE printers (
    printer_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_tag TEXT UNIQUE,
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
                'Retired',
                'standby'
            )
        ),

    is_color INTEGER NOT NULL DEFAULT 0,
    page_count INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    purchase_date DATE,

    toner_code TEXT REFERENCES toner_stock(toner_code),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);