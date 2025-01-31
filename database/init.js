const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create a new database connection
const db = new sqlite3.Database(path.join(__dirname, 'user_profiles.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database.');
});

// Read and execute schema
const schemaSQL = fs.readFileSync(path.join(__dirname, 'updated_schema.sql'), 'utf8');
const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
        console.error('Error enabling foreign keys:', err);
        process.exit(1);
    }
    console.log('Foreign keys enabled.');
});

// Execute schema
db.exec(schemaSQL, (err) => {
    if (err) {
        console.error('Error creating schema:', err);
        process.exit(1);
    }
    console.log('Schema created successfully.');

    // Execute seed data
    db.exec(seedSQL, (err) => {
        if (err) {
            console.error('Error seeding data:', err);
            process.exit(1);
        }
        console.log('Data seeded successfully.');

        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
                process.exit(1);
            }
            console.log('Database connection closed.');
        });
    });
});
