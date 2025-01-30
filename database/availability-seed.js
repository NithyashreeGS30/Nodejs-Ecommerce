const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/config/database');

// Helper function to create date strings
function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

async function seedConsultationTypes() {
    const types = [
        {
            id: uuidv4(),
            name: 'Initial Consultation',
            description: 'First-time consultation to understand your needs and create a treatment plan',
            duration: 60
        },
        {
            id: uuidv4(),
            name: 'Follow-up Session',
            description: 'Regular follow-up session for ongoing treatment',
            duration: 45
        },
        {
            id: uuidv4(),
            name: 'Emergency Session',
            description: 'Urgent consultation for immediate concerns',
            duration: 30
        },
        {
            id: uuidv4(),
            name: 'Family Therapy',
            description: 'Session involving multiple family members',
            duration: 90
        },
        {
            id: uuidv4(),
            name: 'Group Therapy',
            description: 'Therapeutic session in a group setting',
            duration: 120
        }
    ];

    for (const type of types) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO consultation_types (id, name, description, duration) VALUES (?, ?, ?, ?)',
                [type.id, type.name, type.description, type.duration],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }
}

async function seedAvailability() {
    try {
        // First, get all consultant IDs
        const consultants = await new Promise((resolve, reject) => {
            db.all('SELECT id FROM consultants', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        // Time slots for different consultants
        const timeSlots = {
            morning: [
                { start: '08:00:00', end: '09:00:00' },
                { start: '09:15:00', end: '10:15:00' },
                { start: '10:30:00', end: '11:30:00' }
            ],
            afternoon: [
                { start: '13:00:00', end: '14:00:00' },
                { start: '14:15:00', end: '15:15:00' },
                { start: '15:30:00', end: '16:30:00' }
            ],
            evening: [
                { start: '17:00:00', end: '18:00:00' },
                { start: '18:15:00', end: '19:15:00' },
                { start: '19:30:00', end: '20:30:00' }
            ]
        };

        // Create availability for next 14 days
        for (const consultant of consultants) {
            for (let day = 0; day < 14; day++) {
                const date = getDateString(day);
                const dayOfWeek = new Date(date).getDay();

                // Different availability patterns for different consultants
                const slots = [];
                
                // Weekday pattern
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    slots.push(...timeSlots.morning);
                    slots.push(...timeSlots.afternoon);
                    
                    // Some consultants work evenings
                    if (Math.random() > 0.5) {
                        slots.push(...timeSlots.evening);
                    }
                }
                // Weekend pattern
                else {
                    // 50% chance of weekend availability
                    if (Math.random() > 0.5) {
                        slots.push(...timeSlots.morning);
                        if (Math.random() > 0.5) {
                            slots.push(...timeSlots.afternoon);
                        }
                    }
                }

                // Insert availability slots
                for (const slot of slots) {
                    await new Promise((resolve, reject) => {
                        db.run(
                            'INSERT INTO consultant_availability (id, consultant_id, date, start_time, end_time, is_booked) VALUES (?, ?, ?, ?, ?, ?)',
                            [uuidv4(), consultant.id, date, slot.start, slot.end, Math.random() > 0.8 ? 1 : 0], // 20% chance of being booked
                            (err) => {
                                if (err) reject(err);
                                resolve();
                            }
                        );
                    });
                }
            }
        }

        // Seed consultation types
        await seedConsultationTypes();

        console.log('Availability and consultation types data has been inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding availability data:', error);
        process.exit(1);
    }
}

// Run the seed function
seedAvailability();
