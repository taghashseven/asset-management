import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs/promises";
import { pathToFileURL } from "url";

const SCHEMA_VERSION = 1;

const db = await open({
  filename: "./assets.db",
  driver: sqlite3.Database
});

await db.exec("PRAGMA foreign_keys = ON");

// Read current database version
const result = await db.get("PRAGMA user_version");
const currentVersion = result.user_version;

if (currentVersion < SCHEMA_VERSION) {
  console.log(
    `Updating database schema from v${currentVersion} to v${SCHEMA_VERSION}`
  );

  const schema = await fs.readFile(
    "./database/schema.sql",
    "utf8"
  );

  await db.exec(schema);

  await db.exec(
    `PRAGMA user_version = ${SCHEMA_VERSION}`
  );

  console.log("Schema updated");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("Running directly");


}

export default db;