const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database connection
const db = new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, '../../database/user_profiles.db'));

// Enable foreign key support
db.run('PRAGMA foreign_keys = ON');

// Read and execute schema
const schemaPath = path.join(__dirname, '../../database/updated_schema.sql');
const triggersPath = path.join(__dirname, '../../database/triggers.sql');

if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema:', err);
        } else {
            console.log('Schema executed successfully');
            
            // After schema is created, create triggers
            if (fs.existsSync(triggersPath)) {
                const triggers = fs.readFileSync(triggersPath, 'utf8');
                db.exec(triggers, (err) => {
                    if (err) {
                        console.error('Error executing triggers:', err);
                    } else {
                        console.log('Triggers created successfully');
                    }
                });
            }
        }
    });
}

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
});

module.exports = { db };