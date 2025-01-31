const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const jwt = require('jsonwebtoken');

const userController = {
    // Profile Management
    async getProfile(req, res) {
        try {
            console.log('User ID before query:', req.user.id); // Log the user ID
            const user = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT id, name, email, phone, isEmailVerified, createdAt, updatedAt
                    FROM users WHERE id = ?
                `, [req.user.id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error getting profile:', error);
            res.status(500).json({ success: false, error: 'Failed to get profile' });
        }
    },

    // update the user profile
    async updateProfile(req, res) {
        console.log(req.body);
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const allowedFields = [
                'name', 'email', 'phone', 'profile_picture_url',
                'two_factor_method', 'backup_codes'
            ]; // Allowed fields that can be updated

            const updates = [];
            const values = [];
            const userId = req.user.id;
            let newEmailVerificationToken = null;
            let updatedEmail = null;

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    // Handle special cases
                    if (field === 'email') {
                        // Check if email is already in use
                        const existingUser = await new Promise((resolve, reject) => {
                            db.get('SELECT id FROM users WHERE email = ? AND id != ?', [req.body.email, userId], (err, row) => {
                                if (err) reject(err);
                                resolve(row);
                            });
                        });

                        if (existingUser) {
                            return res.status(400).json({
                                success: false,
                                error: 'Email already in use'
                            });
                        }

                        // Generate new verification token
                        newEmailVerificationToken = jwt.sign(
                            { email: req.body.email },
                            process.env.JWT_SECRET,
                            { expiresIn: '24h' }
                        );
                        updatedEmail = req.body.email;

                        // Update email & reset email_verified
                        updates.push('email = ?, email_verified = 0');
                        values.push(req.body.email);
                    }
                    else if (field === 'phone') {
                        // Check if phone is already in use
                        const existingUser = await new Promise((resolve, reject) => {
                            db.get('SELECT id FROM users WHERE phone = ? AND id != ?', [req.body.phone, userId], (err, row) => {
                                if (err) reject(err);
                                resolve(row);
                            });
                        });

                        if (existingUser) {
                            return res.status(400).json({
                                success: false,
                                error: 'Phone number already in use'
                            });
                        }

                        updates.push('phone = ?');
                        values.push(req.body.phone);
                    }
                    else {
                        // For all other allowed fields
                        updates.push(`${field} = ?`);
                        values.push(req.body[field]);
                    }
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No updates provided'
                });
            }

            // Always update the `updated_at` timestamp
            updates.push('updated_at = datetime("now")');

            values.push(userId); // Append userId for WHERE clause

            // Update user information dynamically
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET ${updates.join(', ')}
                    WHERE id = ?
                `, values, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // Get updated user data
            const updatedUser = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT id, name, email, phone, profile_picture_url, email_verified, updated_at 
                    FROM users 
                    WHERE id = ?
                `, [userId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser,
                ...(newEmailVerificationToken && { email_verification_token: newEmailVerificationToken }) // Include token in response if email was updated
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    },


    // Email Preferences
    async getEmailPreferences(req, res) {
        try {
            console.log('User ID before query:', req.user.id); // Log the user ID
            const preferences = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT newsletter, promotions, consultation_reminders, payment_notifications
                    FROM email_preferences 
                    WHERE user_id = ?
                `, [req.user.id], (err, row) => {
                    if (err) reject(err);
                    resolve(row || {
                        newsletter: true,
                        promotions: true,
                        consultation_reminders: true,
                        payment_notifications: true
                    });
                });
            });

            res.json({
                success: true,
                data: preferences
            });
        } catch (error) {
            console.error('Error getting email preferences:', error);
            res.status(500).json({ success: false, error: 'Failed to get email preferences' });
        }
    },

    async updateEmailPreferences(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { newsletter, promotions, consultationReminders, paymentNotifications } = req.body;

            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR REPLACE INTO email_preferences (
                        user_id, newsletter, promotions, consultation_reminders, payment_notifications,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
                `, [req.user.id, newsletter, promotions, consultationReminders, paymentNotifications],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    });
            });

            res.json({
                success: true,
                message: 'Email preferences updated successfully'
            });
        } catch (error) {
            console.error('Error updating email preferences:', error);
            res.status(500).json({ success: false, error: 'Failed to update email preferences' });
        }
    },

    // Account Management
    async deactivateAccount(req, res) {
        try {
            console.log('User ID before query:', req.user.id); // Log the user ID
            await new Promise((resolve, reject) => {
                db.run('UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?',
                    [req.user.id], (err) => {
                        if (err) reject(err);
                        resolve();
                    });
            });

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });
        } catch (error) {
            console.error('Error deactivating account:', error);
            res.status(500).json({ success: false, error: 'Failed to deactivate account' });
        }
    },

    async reactivateAccount(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, reactivationCode } = req.body;

            // Verify reactivation code
            const user = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT id FROM users 
                    WHERE email = ? AND reactivation_code = ? AND is_active = 0
                `, [email, reactivationCode], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid reactivation code or email'
                });
            }

            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET is_active = 1, reactivation_code = NULL, updated_at = datetime('now')
                    WHERE id = ?
                `, [user.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                success: true,
                message: 'Account reactivated successfully'
            });
        } catch (error) {
            console.error('Error reactivating account:', error);
            res.status(500).json({ success: false, error: 'Failed to reactivate account' });
        }
    },

    async deleteAccount(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { password, confirmation } = req.body;

            if (confirmation !== 'DELETE') {
                return res.status(400).json({
                    success: false,
                    error: 'Please type DELETE to confirm account deletion'
                });
            }

            // Verify password
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid password'
                });
            }

            // Start transaction
            await new Promise((resolve, reject) => {
                db.run('BEGIN TRANSACTION', err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            try {
                // Delete all user data
                const tables = [
                    'email_preferences',
                    'notifications',
                    'favorites',
                    'reviews',
                    'consultations',
                    'users'
                ];

                for (const table of tables) {
                    await new Promise((resolve, reject) => {
                        db.run(`DELETE FROM ${table} WHERE user_id = ?`, [req.user.id], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    });
                }

                // Commit transaction
                await new Promise((resolve, reject) => {
                    db.run('COMMIT', err => {
                        if (err) reject(err);
                        resolve();
                    });
                });

                res.json({
                    success: true,
                    message: 'Account deleted successfully'
                });
            } catch (error) {
                // Rollback transaction on error
                await new Promise((resolve) => {
                    db.run('ROLLBACK', () => resolve());
                });
                throw error;
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            res.status(500).json({ success: false, error: 'Failed to delete account' });
        }
    },

    // Notification Management
    async getNotifications(req, res) {
        try {
            console.log('User ID before query:', req.user.id); // Log the user ID
            const notifications = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT id, type, title, message, isRead, createdAt
                    FROM Notifications
                    WHERE userId = ?
                    ORDER BY createdAt DESC
                `, [req.user.id], (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                });
            });

            console.log('Notifications:', notifications); // Log the notifications
            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({ success: false, error: 'Failed to get notifications' });
        }
    },

    async markNotificationRead(req, res) {
        try {
            const { notificationId } = req.params;

            const result = await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE notifications 
                    SET is_read = 1, updated_at = datetime('now')
                    WHERE id = ? AND user_id = ?
                `, [notificationId, req.user.id], function (err) {
                    if (err) reject(err);
                    resolve(this.changes);
                });
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
        }
    },

    async dismissNotification(req, res) {
        try {
            const { notificationId } = req.params;

            const result = await new Promise((resolve, reject) => {
                db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?',
                    [notificationId, req.user.id], function (err) {
                        if (err) reject(err);
                        resolve(this.changes);
                    });
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification dismissed'
            });
        } catch (error) {
            console.error('Error dismissing notification:', error);
            res.status(500).json({ success: false, error: 'Failed to dismiss notification' });
        }
    },

    async updateNotificationPreferences(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, sms, inApp } = req.body;

            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR REPLACE INTO notification_preferences (
                        user_id, email_enabled, sms_enabled, in_app_enabled,
                        updated_at
                    ) VALUES (?, ?, ?, ?, datetime('now'))
                `, [req.user.id, email, sms, inApp], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                success: true,
                message: 'Notification preferences updated successfully'
            });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({ success: false, error: 'Failed to update notification preferences' });
        }
    },

    // Two-Factor Authentication
    async enable2FA(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { method } = req.body;
            const secret = uuidv4(); // In production, use a proper 2FA secret generation

            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET 
                        two_factor_method = ?,
                        two_factor_secret = ?,
                        two_factor_enabled = 0,
                        updated_at = datetime('now')
                    WHERE id = ?
                `, [method, secret, req.user.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // In production, send verification code via the chosen method
            res.json({
                success: true,
                message: '2FA setup initiated. Please verify the code.',
                data: {
                    secret, // In production, don't send this directly
                    verification_code: '123456' // In production, generate and send securely
                }
            });
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            res.status(500).json({ success: false, error: 'Failed to enable 2FA' });
        }
    },

    async verify2FA(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { code } = req.body;

            // In production, properly verify the code
            if (code !== '123456') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid verification code'
                });
            }

            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET 
                        two_factor_enabled = 1,
                        updated_at = datetime('now')
                    WHERE id = ?
                `, [req.user.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                success: true,
                message: '2FA enabled successfully'
            });
        } catch (error) {
            console.error('Error verifying 2FA:', error);
            res.status(500).json({ success: false, error: 'Failed to verify 2FA' });
        }
    },

    async disable2FA(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { password } = req.body;

            // Verify password
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid password'
                });
            }

            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET 
                        two_factor_enabled = 0,
                        two_factor_secret = NULL,
                        updated_at = datetime('now')
                    WHERE id = ?
                `, [req.user.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                success: true,
                message: '2FA disabled successfully'
            });
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
        }
    },

    async generateBackupCodes(req, res) {
        try {
            const codes = Array.from({ length: 10 }, () => {
                return Math.random().toString(36).substr(2, 8).toUpperCase();
            });

            const hashedCodes = await Promise.all(
                codes.map(code => bcrypt.hash(code, 10))
            );

            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE users 
                    SET 
                        backup_codes = ?,
                        updated_at = datetime('now')
                    WHERE id = ?
                `, [JSON.stringify(hashedCodes), req.user.id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                success: true,
                message: 'Backup codes generated successfully',
                data: {
                    codes // In production, show these only once and encourage immediate saving
                }
            });
        } catch (error) {
            console.error('Error generating backup codes:', error);
            res.status(500).json({ success: false, error: 'Failed to generate backup codes' });
        }
    }
};

module.exports = userController;
