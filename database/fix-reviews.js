const { db } = require('../src/config/database');

async function fixReviewsTable() {
    try {
        // Drop the existing reviews table
        await new Promise((resolve, reject) => {
            db.run('DROP TABLE IF EXISTS reviews', (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Create the reviews table with the correct schema
        await new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE reviews (
                    id TEXT PRIMARY KEY,
                    consultation_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                    comment TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        console.log('Reviews table fixed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing reviews table:', error);
        process.exit(1);
    }
}

fixReviewsTable();
