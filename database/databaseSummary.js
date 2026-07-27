import db from "../database/db.js";

/**
 * Inspects the SQLite schema and returns a full structural summary including:
 * - List of all user tables
 * - Column metadata (names, data types, primary keys, non-null constraints)
 * - Foreign key relationships (source column, target table, target column)
 * 
 * @returns {Promise<Object>} An object containing table metrics and structural breakdown.
 */
export async function getDatabaseSummary() {
  try {
    // 1. Fetch all user-created tables (excluding SQLite internal tables)
    const tablesQuery = `
      SELECT name 
      FROM sqlite_master 
      WHERE type = 'table' 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `;
    const tables = await db.all(tablesQuery);

    const summary = {
      total_tables: tables.length,
      tables: {}
    };

    // 2. Iterate through each table to inspect its schema and foreign keys
    for (const { name: tableName } of tables) {
      // PRAGMA queries run in parallel for optimal performance
      const [columns, foreignKeys] = await Promise.all([
        db.all(`PRAGMA table_info("${tableName}")`),
        db.all(`PRAGMA foreign_key_list("${tableName}")`)
      ]);

      summary.tables[tableName] = {
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type,
          primaryKey: col.pk === 1,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value
        })),
        relationships: foreignKeys.map((fk) => ({
          from_column: fk.from,
          target_table: fk.table,
          target_column: fk.to,
          on_update: fk.on_update,
          on_delete: fk.on_delete
        }))
      };
    }

    return summary;

  } catch (error) {
    console.error("Error fetching database summary:", error);
    throw error;
  }
}