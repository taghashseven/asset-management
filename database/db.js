import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs/promises";
import path from "path";

export const db = await open({
    filename: "./assets.db",
    driver: sqlite3.Database
});

await db.exec("PRAGMA foreign_keys = ON");

const { user_version } = await db.get("PRAGMA user_version");

const migrationFolder = "./database/migrate";

const files = (await fs.readdir(migrationFolder))
    .filter(file => file.endsWith(".sql"))
    .sort();

let version = user_version;

for (const file of files) {

    const migrationVersion = parseInt(file.split("_")[0], 10);

    if (migrationVersion > version) {

        console.log(`Running ${file}`);

        const sql = await fs.readFile(
            path.join(migrationFolder, file),
            "utf8"
        );

        await db.exec(sql);

        version = migrationVersion;

        await db.exec(
            `PRAGMA user_version = ${version}`
        );

        console.log(`${file} applied`);
    }
}

// if the database is empty, insert the default admin user
const adminExists = await db.get(
    "SELECT * FROM users WHERE username = ?",
    "admin"
);

if (!adminExists) {
    const bcrypt = await import("bcrypt");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("admin", saltRounds);
    await db.run(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        "admin",
        passwordHash,
        "admin"
    );
}



export default db;