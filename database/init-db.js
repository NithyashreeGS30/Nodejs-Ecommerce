const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'user_profiles.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database successfully');
});

// Read and execute schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Split the schema into individual statements
const statements = schema.split(';').filter(stmt => stmt.trim());

// Execute each statement
db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    
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
    
    console.log('Database schema initialized successfully');
    
    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        console.log('Database connection closed');
    });
});
