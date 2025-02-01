const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Profile Management Routes
router.get('/profile',
    authMiddleware.verifyToken,
    userController.getProfile
);

router.put('/profile',
    authMiddleware.verifyToken,
    [
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').optional().isEmail().withMessage('Invalid email format'),
        body('phone').optional().matches(/^\+?[\d\s-]{10,}$/).withMessage('Invalid phone number'),
    ],
    userController.updateProfile
);

// Account Management Routes
router.post('/account/deactivate',
    authMiddleware.verifyToken,
    userController.deactivateAccount
);

router.post('/account/reactivate',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('reactivationCode').notEmpty().withMessage('Reactivation code is required')
    ],
    userController.reactivateAccount
);

router.delete('/account',
    authMiddleware.verifyToken,
    [
        body('password').notEmpty().withMessage('Password is required for account deletion'),
        body('confirmation').equals('DELETE').withMessage('Please type DELETE to confirm')
    ],
    userController.deleteAccount
);











// Notification Management Routes
router.get('/notifications',
    authMiddleware.verifyToken,
    userController.getNotifications
);

router.put('/notifications/:notificationId/read',
    authMiddleware.verifyToken,
    userController.markNotificationRead
);

router.delete('/notifications/:notificationId',
    authMiddleware.verifyToken,
    userController.dismissNotification
);

// Notification Preferences Routes
router.get('/preferences/notifications',
    authMiddleware.verifyToken,
    userController.getNotificationPreferences
);

router.put('/preferences/notifications/:type',
    authMiddleware.verifyToken,
    [
        body('email_enabled').isBoolean(),
        body('push_enabled').isBoolean()
    ],
    userController.updateNotificationPreference
);



// Email Preferences Routes
router.get('/preferences/email',
    authMiddleware.verifyToken,
    userController.getEmailPreferences
);

router.put('/preferences/email',
    authMiddleware.verifyToken,
    [
        body('marketing_emails').isBoolean(),
        body('newsletter').isBoolean()
    ],
    userController.updateEmailPreferences
);












// Two-Factor Authentication Routes
router.post('/2fa/enable',
    authMiddleware.verifyToken,
    [
        body('method').isIn(['sms', 'email', 'authenticator']).withMessage('Invalid 2FA method')
    ],
    userController.enable2FA
);

router.post('/2fa/verify',
    authMiddleware.verifyToken,
    [
        body('code').notEmpty().withMessage('Verification code is required')
    ],
    userController.verify2FA
);

router.post('/2fa/disable',
    authMiddleware.verifyToken,
    [
        body('password').notEmpty().withMessage('Password is required to disable 2FA')
    ],
    userController.disable2FA
);

router.post('/2fa/backup-codes',
    authMiddleware.verifyToken,
    userController.generateBackupCodes
);

module.exports = router;