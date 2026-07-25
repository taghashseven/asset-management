import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from "../database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handles saving incoming base64 forms to disk and DB atomically.
 * @param {Object} reqBody - Incoming payload containing employee_id and forms.
 */
export async function createEmployeeForms(reqBody) {
  const { employee_id, forms } = reqBody;

  if (!employee_id || !Array.isArray(forms) || forms.length === 0) {
    throw new Error('Invalid request payload: employee_id and non-empty forms array required.');
  }

  // Target directory: public/forms
  const targetDir = path.resolve(__dirname, '../public/forms');
  await fs.mkdir(targetDir, { recursive: true });

  const writtenFilePaths = []; // Keeps track of files created during this call
  const insertedRecords = [];

  // 1. Begin Database Transaction
  await db.run('BEGIN TRANSACTION');

  try {
    for (const form of forms) {
      const { filename, string: base64Data } = form;

      if (!filename || !base64Data) continue;

      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const safeFilename = `${uniquePrefix}-${filename}`;

      const absolutePath = path.join(targetDir, safeFilename);
      // Normalized path for DB consistency across OS (e.g. forward slashes)
      const relativeFilePath = path.posix.join('public', 'forms', safeFilename);

      // Extract Base64 and write file to disk
      const base64String = base64Data.split(';base64,').pop();
      const buffer = Buffer.from(base64String, 'base64');

      await fs.writeFile(absolutePath, buffer);
      
      // Track absolute file path for potential cleanup if DB fails later
      writtenFilePaths.push(absolutePath);

      // Insert into DB inside the transaction
      const query = `
        INSERT INTO employee_forms (employee_id, file_path)
        VALUES (?, ?)
      `;

      const result = await db.run(query, [employee_id, relativeFilePath]);

      insertedRecords.push({
        form_id: result.lastID,
        employee_id,
        file_path: relativeFilePath,
      });
    }

    // 2. Commit transaction if everything succeeds
    await db.run('COMMIT');

    return insertedRecords;

  } catch (error) {
    // 3. Rollback DB changes if anything fails
    await db.run('ROLLBACK');

    // 4. Clean up any files that were already written to disk
    await Promise.all(
      writtenFilePaths.map((filePath) =>
        fs.unlink(filePath).catch((cleanupErr) => {
          console.error(`Failed to delete orphan file ${filePath}:`, cleanupErr);
        })
      )
    );

    // Re-throw error to let route handler respond with 500
    throw error;
  }
}


/**
 * Deletes an employee form by form_id (removes file from disk and record from DB atomically).
 * @param {number|string} formId - The ID of the form to delete.
 */
export async function deleteEmployeeForm(formId) {
  if (!formId) {
    throw new Error('Invalid request: form_id is required.');
  }

  // 1. Begin Database Transaction
  await db.run('BEGIN TRANSACTION');

  try {
    // 2. Fetch the file path first so we know which file to delete
    const findQuery = `SELECT file_path FROM employee_forms WHERE form_id = ?`;
    const record = await db.get(findQuery, [formId]);

    if (!record) {
      await db.run('ROLLBACK');
      throw new Error(`Form with ID ${formId} not found.`);
    }

    // Convert stored relative path back to an absolute disk path
    // Target root resolved relative to this file
    const rootDir = path.resolve(__dirname, '..'); 
    const absolutePath = path.join(rootDir, record.file_path);

    // 3. Delete from DB inside transaction
    const deleteQuery = `DELETE FROM employee_forms WHERE form_id = ?`;
    await db.run(deleteQuery, [formId]);

    // 4. Delete the physical file from disk
    try {
      await fs.unlink(absolutePath);
    } catch (fsErr) {
      // If file is already missing on disk (ENOENT), ignore and proceed. 
      // Re-throw any other filesystem error (like permissions issue).
      if (fsErr.code !== 'ENOENT') {
        throw fsErr;
      }
    }

    // 5. Commit transaction if everything succeeded
    await db.run('COMMIT');

    return { success: true, message: `Form ${formId} deleted successfully.` };

  } catch (error) {
    // Rollback DB if anything failed
    await db.run('ROLLBACK');
    throw error;
  }
}


// GET ALL FORMS 
// GET ALL FORMS 
export async function getAllForms() {
  try {
    let results = await db.all(`
      SELECT 
        ef.*, 
        e.email 
      FROM employee_forms ef
      JOIN employees e ON ef.employee_id = e.employee_id
    `);
    
    return results;
  } catch (error) {
    console.error("Error fetching forms:", error);
    throw error;
  }
}