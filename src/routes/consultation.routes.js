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
        body('consultant_id').notEmpty().withMessage('Consultant ID is required'),
        body('consultation_type_id').notEmpty().withMessage('Consultation type is required'),
        body('scheduled_start_time').notEmpty().withMessage('Start time is required')
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
        body('consultation_id').notEmpty().withMessage('Consultation ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().isString().withMessage('Comment must be a string')
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

module.exports = router;