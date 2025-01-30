const { db } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

const notificationTypes = [
    'consultation_scheduled',
    'consultation_reminder',
    'consultation_canceled',
    'payment_success',
    'payment_failed',
    'profile_update',
    'new_message',
    'system_maintenance'
];

const sampleNotifications = [
    {
        type: 'consultation_scheduled',
        title: 'New Consultation Scheduled',
        message: 'Your consultation with Dr. Smith is scheduled for tomorrow at 2:00 PM'
    },
    {
        type: 'consultation_reminder',
        title: 'Upcoming Consultation Reminder',
        message: 'Don\'t forget your consultation in 1 hour!'
    },
    {
        type: 'payment_success',
        title: 'Payment Successful',
        message: 'Your payment of $50 for consultation #1234 was successful'
    },
    {
        type: 'new_message',
        title: 'New Message from Consultant',
        message: 'You have a new message regarding your upcoming consultation'
    },
    {
        type: 'system_maintenance',
        title: 'Scheduled Maintenance',
        message: 'The system will be under maintenance on Sunday from 2 AM to 4 AM'
    },
    {
        type: 'profile_update',
        title: 'Profile Updated Successfully',
        message: 'Your profile information has been updated'
    },
    {
        type: 'consultation_canceled',
        title: 'Consultation Canceled',
        message: 'Your consultation #5678 has been canceled'
    },
    {
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your recent payment attempt for consultation #9012 failed'
    }
];

async function seedNotifications() {
    try {
        // Get all users
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT id FROM users', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        if (users.length === 0) {
            console.log('No users found in the database');
            return;
        }

        // Start transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                resolve();
            });
        });

        // For each user, add multiple notifications
        for (const user of users) {
            const numberOfNotifications = Math.floor(Math.random() * 5) + 5; // 5-10 notifications per user
            
            for (let i = 0; i < numberOfNotifications; i++) {
                const notification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
                const isRead = Math.random() > 0.5 ? 1 : 0; // Randomly mark some as read
                const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random date within last week

                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO notifications (
                            id, user_id, type, title, message, is_read,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, datetime(?), datetime(?))
                    `, [
                        uuidv4(),
                        user.id,
                        notification.type,
                        notification.title,
                        notification.message,
                        isRead,
                        createdAt.toISOString(),
                        createdAt.toISOString()
                    ], err => {
                        if (err) reject(err);
                        resolve();
                    });
                });
            }
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => {
                if (err) reject(err);
                resolve();
            });
        });

        console.log('Sample notifications added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding notifications:', error);
        // Rollback transaction on error
        await new Promise((resolve) => {
            db.run('ROLLBACK', () => resolve());
        });
        process.exit(1);
    }
}

seedNotifications();
