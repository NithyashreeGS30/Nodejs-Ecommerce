const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { db } = require('../config/database');

const authController = {
    async register(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    errors: errors.array()
                });
            }

            const { name, email, phone, password } = req.body;

            // Check if user already exists
            const existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User with this email or phone already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const userId = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
                    [userId, name, email, phone, hashedPassword],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            res.status(201).json({
                status: 'success',
                message: 'Registration successful. Please verify your email.'
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error registering user'
            });
        }
    },

    async login(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Find user
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            res.json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error logging in'
            });
        }
    },

    async logout(req, res) {
        try {
            res.json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error logging out'
            });
        }
    },

    async logoutAll(req, res) {
        try {
            res.json({
                status: 'success',
                message: 'Logged out from all devices'
            });
        } catch (error) {
            console.error('Logout all error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error logging out from all devices'
            });
        }
    },

    async verifyEmail(req, res) {
        try {
            const { token } = req.params;

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Update user
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET is_verified = 1 WHERE email = ?',
                    [decoded.email],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            res.json({
                status: 'success',
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error verifying email'
            });
        }
    },

    async resendVerification(req, res) {
        try {
            res.json({
                status: 'success',
                message: 'Verification email sent'
            });
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error sending verification email'
            });
        }
    },

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Check if user exists
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Password reset email sent successfully'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error sending password reset email'
            });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password } = req.body;

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Update password
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashedPassword, decoded.id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            res.json({
                status: 'success',
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error resetting password'
            });
        }
    }
};

module.exports = authController;