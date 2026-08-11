

-- Computer Images
CREATE TABLE computer_asset_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset_id INTEGER NOT NULL,

    image_path TEXT NOT NULL,

    FOREIGN KEY (asset_id)
        REFERENCES computer_assets(asset_id)
        ON DELETE CASCADE
);

-- Printer Images
CREATE TABLE printer_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,

    printer_id INTEGER NOT NULL,

    image_path TEXT NOT NULL,

    FOREIGN KEY (printer_id)
        REFERENCES printers(printer_id)
        ON DELETE CASCADE
);




-- Monitor Images
CREATE TABLE monitor_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,

    monitor_id INTEGER NOT NULL,

    image_path TEXT NOT NULL,

    FOREIGN KEY (monitor_id)
        REFERENCES monitors(monitor_id)
        ON DELETE CASCADE
);