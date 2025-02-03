const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "../../database/user_profiles.db");
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Enable foreign key support
db.run("PRAGMA foreign_keys = ON");

// Read and execute schema if the database is new
const schemaPath = path.join(__dirname, "../../database/updated_schema.sql");
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");

    db.serialize(() => {
        db.exec(schema, (err) => {
            if (err) {
                console.error("Error executing schema:", err);
            } else {
                console.log("Database schema executed successfully.");
            }
        });
    });
}

// Handle database errors
db.on("error", (err) => {
    console.error("Database error:", err);
});

module.exports = { db };
