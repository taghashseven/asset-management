
-- 1. Start a strict transaction to queue and hold incoming live traffic safely
BEGIN IMMEDIATE TRANSACTION;

-- 2. Turn off Foreign Key constraints so we can drop tables without trigger errors
PRAGMA foreign_keys = OFF;

-- 3. Create a temporary, identical backup table to hold your current production data
CREATE TABLE temp_assignments_backup AS 
SELECT 
    assignment_id, 
    serial_number, 
    employee_email, 
    date_issued, 
    date_returned, 
    notes 
FROM asset_assignments;

-- 4. Drop the original production table
DROP TABLE asset_assignments;

-- 5. Re-create the table with your exact column layouts, but the updated CHECK constraint
CREATE TABLE asset_assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    serial_number TEXT NOT NULL,
    employee_email TEXT NOT NULL,

    date_issued DATE,
    date_returned DATE,

    notes TEXT,

    -- Updated Constraint: Allows date_returned to exist even if date_issued is NULL
    CHECK (
        date_returned IS NULL
        OR date_issued IS NULL
        OR date_returned >= date_issued
    ),

    FOREIGN KEY(serial_number)
        REFERENCES computer_assets(serial_number)
        ON DELETE RESTRICT,

    FOREIGN KEY(employee_email)
        REFERENCES employees(email)
        ON DELETE RESTRICT
);

-- 6. Move all your original production records back into the newly built table
INSERT INTO asset_assignments (
    assignment_id, 
    serial_number, 
    employee_email, 
    date_issued, 
    date_returned, 
    notes
)
SELECT 
    assignment_id, 
    serial_number, 
    employee_email, 
    date_issued, 
    date_returned, 
    notes
FROM temp_assignments_backup;

-- 7. Safely destroy the temporary backup table
DROP TABLE temp_assignments_backup;

-- 8. Restore constraint enforcement and commit all changes instantly
PRAGMA foreign_keys = ON;
COMMIT;

-- 9. Final verification check (Should return nothing if everything went perfectly)
PRAGMA foreign_key_check;

