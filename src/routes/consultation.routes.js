const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const consultationController = require('../controllers/consultation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
// Browse consultants
router.get('/consultants', consultationController.browseConsultants);

// Get consultant details
router.get('/consultants/:id', consultationController.getConsultantDetails);

// Get consultant availability
router.get('/consultants/:id/availability', consultationController.getConsultantAvailability);

// Protected routes - require authentication
// Book consultation
router.post('/book',
    authMiddleware.verifyToken,
    [
        body('consultantId').notEmpty().withMessage('Consultant ID is required'),
        body('consultationTypeId').notEmpty().withMessage('Consultation type is required'),
        body('startTime').notEmpty().withMessage('Start time is required')
    ],
    consultationController.bookConsultation
);

// Get user consultations
router.get('/my-consultations',
    authMiddleware.verifyToken,
    consultationController.getMyConsultations
);

// Add review
router.post('/reviews',
    authMiddleware.verifyToken,
    [
        body('consultationId').notEmpty().withMessage('Consultation ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('review').optional().isString().withMessage('Review must be a string')
    ],
    consultationController.addReview
);

// Add to favorites
router.post('/favorites/:consultantId',
    authMiddleware.verifyToken,
    consultationController.addToFavorites
);

// Remove from favorites
router.delete('/favorites/:consultantId',
    authMiddleware.verifyToken,
    consultationController.removeFromFavorites
);

// Get favorites
router.get('/favorites',
    authMiddleware.verifyToken,
    consultationController.getFavorites
);

// Get consultant availability
router.get('/consultants/:id/availability', consultationController.getConsultantAvailability);

router.put("/consultations/:consultationId/complete", consultationController.markConsultationCompleted);

// Update consultation status
router.patch('/consultations/:id',
    authMiddleware.verifyToken,
    consultationController.updateConsultationStatus
);

module.exports = router;