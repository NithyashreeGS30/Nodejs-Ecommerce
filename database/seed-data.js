const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/config/database');

async function seedData() {
    try {
        // Hash password for all users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('Password123!', salt);

        const consultants = [
            {
                user: {
                    id: uuidv4(),
                    name: 'Dr. Sarah Johnson',
                    email: 'sarah.johnson@example.com',
                    phone: '1234567891',
                    password
                },
                consultant: {
                    expertise: 'Clinical Psychology',
                    languages: 'English, Spanish',
                    hourly_rate: 150
                }
            },
            {
                user: {
                    id: uuidv4(),
                    name: 'Dr. Michael Chen',
                    email: 'michael.chen@example.com',
                    phone: '1234567892',
                    password
                },
                consultant: {
                    expertise: 'Cognitive Behavioral Therapy',
                    languages: 'English, Mandarin',
                    hourly_rate: 175
                }
            },
            {
                user: {
                    id: uuidv4(),
                    name: 'Dr. Emily Rodriguez',
                    email: 'emily.rodriguez@example.com',
                    phone: '1234567893',
                    password
                },
                consultant: {
                    expertise: 'Family Therapy',
                    languages: 'English, Spanish',
                    hourly_rate: 160
                }
            },
            {
                user: {
                    id: uuidv4(),
                    name: 'Dr. James Wilson',
                    email: 'james.wilson@example.com',
                    phone: '1234567894',
                    password
                },
                consultant: {
                    expertise: 'Anxiety and Depression',
                    languages: 'English',
                    hourly_rate: 165
                }
            },
            {
                user: {
                    id: uuidv4(),
                    name: 'Dr. Priya Patel',
                    email: 'priya.patel@example.com',
                    phone: '1234567895',
                    password
                },
                consultant: {
                    expertise: 'Child Psychology',
                    languages: 'English, Hindi, Gujarati',
                    hourly_rate: 170
                }
            }
        ];

        // Insert data
        for (const entry of consultants) {
            // Insert user
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
                    [entry.user.id, entry.user.name, entry.user.email, entry.user.phone, entry.user.password],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            // Insert consultant
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO consultants (id, user_id, expertise, languages, hourly_rate, isActive) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), entry.user.id, entry.consultant.expertise, entry.consultant.languages, entry.consultant.hourly_rate, true],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        }

        console.log('Sample data has been inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

// Run the seed function
seedData();
