DROP TABLE IF EXISTS other_equipment;

CREATE TABLE other_equipment (
    equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    description TEXT,

    serial_number TEXT UNIQUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- // create teh iamge table
drop table IF EXISTS other_equipment_images ; 
CREATE TABLE other_equipment_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,

    equipment_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,

    FOREIGN KEY (equipment_id)
        REFERENCES other_equipment(equipment_id)
        ON DELETE CASCADE
);