-- ===========================================
-- DATABASE BACKUP
-- Creates a complete backup before migration
-- ===========================================

VACUUM INTO 'asset_management_backup_2026-07-01.db';

-- ===========================================
-- BEGIN MIGRATION
-- ===========================================

BEGIN IMMEDIATE TRANSACTION;

PRAGMA foreign_keys = OFF;

-- Migration steps here...

PRAGMA foreign_keys = ON;

COMMIT;

PRAGMA foreign_key_check;