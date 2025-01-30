const { db } = require('../src/config/database');

async function checkData() {
    try {
        // Check consultant_availability
        console.log('Checking consultant_availability table:');
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM consultant_availability LIMIT 5', (err, rows) => {
                if (err) reject(err);
                console.log(rows);
                resolve();
            });
        });

        // Check consultants
        console.log('\nChecking consultants table:');
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM consultants LIMIT 5', (err, rows) => {
                if (err) reject(err);
                console.log(rows);
                resolve();
            });
        });

        // Check consultation_types
        console.log('\nChecking consultation_types table:');
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM consultation_types', (err, rows) => {
                if (err) reject(err);
                console.log(rows);
                resolve();
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkData();
