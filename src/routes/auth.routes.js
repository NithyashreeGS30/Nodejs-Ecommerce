const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Input validation middleware
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const passwordResetValidation = [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Auth routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.post('/logout-all', authMiddleware.verifyToken, authController.logoutAll);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authMiddleware.verifyToken, authController.resendVerification);
router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);
router.post('/reset-password/:token', passwordResetValidation, authController.resetPassword);

module.exports = router;