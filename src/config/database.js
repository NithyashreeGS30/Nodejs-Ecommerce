const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use the database in the database directory
const db = new sqlite3.Database(path.join(__dirname, '../../database/user_profiles.db'));

// Enable foreign key support
db.run('PRAGMA foreign_keys = ON');

// Read and execute schema if database is new
const schemaPath = path.join(__dirname, '../../database/schema.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    db.serialize(() => {
        statements.forEach(statement => {
            if (statement.trim()) {
                db.run(statement, (err) => {
                    if (err) {
                        console.error('Error executing statement:', err);
                        console.error('Statement:', statement);
                    }
                });
            }
        });
    });
}

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
});

module.exports = { db };