const { db } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
    try {
        // Create test users
        const userPassword = await bcrypt.hash('password123', 10);
        const consultantPassword = await bcrypt.hash('consultant123', 10);

        const userId = uuidv4();
        const consultantUserId = uuidv4();
        const consultantId = uuidv4();
        
        // Insert test user
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO users (id, name, email, password, role)
                VALUES (?, ?, ?, ?, ?)
            `, [userId, 'Test User', 'user@test.com', userPassword, 'user'],
            (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Insert test consultant user
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO users (id, name, email, password, role)
                VALUES (?, ?, ?, ?, ?)
            `, [consultantUserId, 'Test Consultant', 'consultant@test.com', consultantPassword, 'consultant'],
            (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Insert consultant profile
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO consultants (id, user_id, bio, expertise, languages)
                VALUES (?, ?, ?, ?, ?)
            `, [
                consultantId,
                consultantUserId,
                'Experienced consultant with 10+ years of experience',
                'Career Counseling,Leadership Development',
                'English,Spanish'
            ], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Insert consultation types
        const consultationTypes = [
            {
                id: uuidv4(),
                name: 'Career Guidance',
                description: '1-hour career counseling session',
                duration: 60,
                price: 100.00
            },
            {
                id: uuidv4(),
                name: 'Quick Check-in',
                description: '30-minute quick consultation',
                duration: 30,
                price: 50.00
            }
        ];

        for (const type of consultationTypes) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO consultation_types (id, name, description, duration, price)
                    VALUES (?, ?, ?, ?, ?)
                `, [type.id, type.name, type.description, type.duration, type.price],
                (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }

        // Insert consultant availability
        const days = [1, 2, 3, 4, 5]; // Monday to Friday
        for (const day of days) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO consultant_availability (id, consultant_id, day_of_week, start_time, end_time)
                    VALUES (?, ?, ?, ?, ?)
                `, [uuidv4(), consultantId, day, '09:00', '17:00'],
                (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
};

// Run seeder
seedDatabase();
