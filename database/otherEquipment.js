import db from './db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch all equipment along with their attached images array
 */
export async function getAllOtherEquipment() {
    const rows = await db.all(`
        SELECT 
            e.equipment_id,
            e.name,
            e.description,
            e.serial_number,
            COALESCE(
                json_group_array(
                    json_object(
                        'image_id', img.image_id,
                        'file_path', img.image_path
                    )
                ) FILTER (WHERE img.image_id IS NOT NULL),
                '[]'
            ) AS images
        FROM other_equipment e
        LEFT JOIN other_equipment_images img ON e.equipment_id = img.equipment_id
        GROUP BY e.equipment_id;
    `);

    // Parse JSON string array returned by SQLite json_group_array
    return rows.map(row => ({
        ...row,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
    }));
}

/**
 * Atomic upsert for equipment & image processing
 */
export async function upsertOtherEquipment(equipment) {
    const uploadDir = path.resolve(__dirname, '../public/other_equipment');
    const savedDiskFiles = [];

    // Ensure target storage directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    try {
        // 1. Begin Database Transaction for Atomicity
        await db.run('BEGIN TRANSACTION');

        let equipmentId = equipment.equipment_id || null;

        // 2. Upsert parent equipment record
        if (equipmentId) {
            await db.run(
                `
                INSERT INTO other_equipment (equipment_id, name, description, serial_number)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(equipment_id)
                DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    serial_number = excluded.serial_number
                `,
                [equipmentId, equipment.name, equipment.description, equipment.serial_number]
            );
        } else {
            const result = await db.run(
                `
                INSERT INTO other_equipment (name, description, serial_number)
                VALUES (?, ?, ?)
                `,
                [equipment.name, equipment.description, equipment.serial_number]
            );
            equipmentId = result.lastID;
        }

        // 3. Process & Save New Base64 Images
        if (Array.isArray(equipment.images) && equipment.images.length > 0) {
            for (const img of equipment.images) {
                if (!img || !img.string) continue;

                // Sanitize filename
                const rawName = (img.filename || 'image.png').replace(/[^a-zA-Z0-9_.-]/g, '_');
                const filename = `${Date.now()}-${rawName}`;
                
                // Full physical disk path (used strictly for saving to disk)
                const fullImagePath = path.join(uploadDir, filename);

                // Relative web path saved to Database (cross-platform with forward slashes)
                const relativeDbPath = path.join('public', 'other_equipment', filename).replace(/\\/g, '/');

                // Convert Base64 string to Buffer
                const base64Data = img.string.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // Write file to physical disk
                await fs.writeFile(fullImagePath, buffer);
                savedDiskFiles.push(fullImagePath);

                // Insert relative path into SQLite
                await db.run(
                    `INSERT INTO other_equipment_images (equipment_id, image_path) VALUES (?, ?)`,
                    [equipmentId, relativeDbPath]
                );
            }
        }

        // 4. Commit transaction
        await db.run('COMMIT');
        return { success: true, equipment_id: equipmentId };

    } catch (error) {
        // 5. Rollback DB changes if anything fails
        await db.run('ROLLBACK');

        // Rollback physical disk writes
        for (const filePath of savedDiskFiles) {
            try {
                await fs.unlink(filePath);
            } catch (fsErr) {
                console.error(`Failed to cleanup file ${filePath}:`, fsErr);
            }
        }

        console.error("Atomic upsert operation failed:", error);
        throw error;
    }
}