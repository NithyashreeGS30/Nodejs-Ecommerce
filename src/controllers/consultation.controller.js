const { validationResult } = require('express-validator');
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const consultationController = {
    // Browse and Search Consultants
    async browseConsultants(req, res) {
        try {
            const {
                expertise,
                language,
                rating,
                minExperience,
                maxPrice,
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    c.*,
                    u.name,
                    u.email,
                    (
                        SELECT COUNT(r.id) 
                        FROM Reviews r 
                        JOIN Consultations cons ON r.consultationId = cons.id
                        WHERE cons.consultantId = c.id
                    ) as reviewCount,
                    (
                        SELECT AVG(CAST(r.rating as FLOAT)) 
                        FROM Reviews r 
                        JOIN Consultations cons ON r.consultationId = cons.id
                        WHERE cons.consultantId = c.id
                    ) as averageRating
                FROM Consultants c
                JOIN Users u ON c.userId = u.id
                WHERE c.isAvailable = 1
            `;

            const params = [];

            if (expertise || language || rating || minExperience || maxPrice) {
                const conditions = [];

                if (rating) {
                    conditions.push('c.rating >= ?');
                    params.push(rating);
                }

                if (minExperience) {
                    conditions.push('c.experience >= ?');
                    params.push(minExperience);
                }

                if (maxPrice) {
                    conditions.push('c.hourlyRate <= ?');
                    params.push(maxPrice);
                }

                if (conditions.length > 0) {
                    query += ' AND ' + conditions.join(' AND ');
                }
            }

            query += ' ORDER BY c.rating DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const consultants = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else {
                        // Post-process to filter by expertise and language
                        let filteredRows = rows;

                        if (expertise) {
                            filteredRows = filteredRows.filter(row => {
                                const expertiseList = JSON.parse(row.expertise || '[]');
                                return expertiseList.some(e =>
                                    e.toLowerCase().includes(expertise.toLowerCase())
                                );
                            });
                        }

                        if (language) {
                            filteredRows = filteredRows.filter(row => {
                                const languageList = JSON.parse(row.languages || '[]');
                                return languageList.some(l =>
                                    l.toLowerCase().includes(language.toLowerCase())
                                );
                            });
                        }

                        resolve(filteredRows);
                    }
                });
            });

            // Parse JSON fields
            const processedConsultants = consultants.map(consultant => ({
                ...consultant,
                expertise: JSON.parse(consultant.expertise || '[]'),
                languages: JSON.parse(consultant.languages || '[]'),
                availability: consultant.availability ? JSON.parse(consultant.availability) : null,
                filters: consultant.filters ? JSON.parse(consultant.filters) : null
            }));

            res.json({
                success: true,
                data: processedConsultants
            });
        } catch (error) {
            console.error('Error in browseConsultants:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },


    // Mark Consultation as Completed
    async markConsultationCompleted(req, res) {
        try {
            const { consultationId } = req.params;

            // Check if the consultation exists
            const consultation = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM Consultations WHERE id = ?', [consultationId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation not found'
                });
            }

            // Update the consultation status to "completed"
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE Consultations SET status = ? WHERE id = ?',
                    ['completed', consultationId],
                    function (err) {
                        if (err) {
                            console.error('Error updating consultation status:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            res.json({
                success: true,
                message: `Consultation ${consultationId} marked as completed`
            });
        } catch (error) {
            console.error('Error in markConsultationCompleted:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },


    // Get Consultant Details
    async getConsultantDetails(req, res) {
        try {
            const { id } = req.params;

            const consultant = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT 
                        c.*,
                        u.name,
                        u.email,
                        (
                            SELECT COUNT(r.id) 
                            FROM Reviews r 
                            JOIN Consultations cons ON r.consultationId = cons.id
                            WHERE cons.consultantId = c.id
                        ) as reviewCount,
                        (
                            SELECT AVG(CAST(r.rating as FLOAT)) 
                            FROM Reviews r 
                            JOIN Consultations cons ON r.consultationId = cons.id
                            WHERE cons.consultantId = c.id
                        ) as averageRating
                    FROM Consultants c
                    JOIN Users u ON c.userId = u.id
                    WHERE c.id = ? AND c.isAvailable = 1`,
                    [id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            // Get consultation types
            const consultationTypes = await new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM ConsultationTypes WHERE consultantId = ? AND isActive = 1',
                    [id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            // Get recent reviews
            const reviews = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT r.* 
                     FROM Reviews r
                     JOIN Consultations c ON r.consultationId = c.id
                     WHERE c.consultantId = ? AND r.isPublic = 1
                     ORDER BY r.createdAt DESC LIMIT 5`,
                    [id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            res.json({
                success: true,
                data: {
                    ...consultant,
                    consultationTypes,
                    recentReviews: reviews
                }
            });
        } catch (error) {
            console.error('Error in getConsultantDetails:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Get Consultant Availability
    async getConsultantAvailability(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Both startDate and endDate are required'
                });
            }

            // First check if consultant exists
            const consultant = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM Consultants WHERE id = ? AND isAvailable = 1', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            // Get all consultations within the date range
            const consultations = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT startTime, endTime, status
                     FROM Consultations
                     WHERE consultantId = ?
                     AND status != 'cancelled'
                     AND (
                         (startTime BETWEEN ? AND ?) OR
                         (endTime BETWEEN ? AND ?) OR
                         (startTime <= ? AND endTime >= ?)
                     )`,
                    [id, startDate, endDate, startDate, endDate, startDate, endDate],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            // Get consultant's availability settings
            const availability = consultant.availability ? JSON.parse(consultant.availability) : null;

            res.json({
                success: true,
                data: {
                    consultantId: id,
                    availability,
                    bookedSlots: consultations
                }
            });
        } catch (error) {
            console.error('Error in getConsultantAvailability:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Book Consultation
    async bookConsultation(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { consultantId, consultationTypeId, startTime } = req.body;
            const userId = 'u1'; // Use our test user ID

            // Verify consultant exists and is available
            const consultant = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM Consultants WHERE id = ? AND isAvailable = 1',
                    [consultantId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found or is unavailable'
                });
            }

            // Get consultation type details
            const consultationType = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM ConsultationTypes WHERE id = ? AND consultantId = ? AND isActive = 1',
                    [consultationTypeId, consultantId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!consultationType) {
                return res.status(404).json({
                    success: false,
                    error: 'Invalid consultation type'
                });
            }

            // Calculate end time based on duration
            const startDate = new Date(startTime);
            const endDate = new Date(startDate.getTime() + consultationType.duration * 60000);

            // Check for scheduling conflicts
            const conflict = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT 1 FROM Consultations 
                     WHERE consultantId = ? 
                     AND status != 'cancelled'
                     AND (
                         (startTime BETWEEN ? AND ?) OR
                         (endTime BETWEEN ? AND ?) OR
                         (startTime <= ? AND endTime >= ?)
                     )`,
                    [consultantId, startDate.toISOString(), endDate.toISOString(),
                        startDate.toISOString(), endDate.toISOString(),
                        startDate.toISOString(), endDate.toISOString()],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (conflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected time slot is not available'
                });
            }

            // Create consultation
            const consultationId = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO Consultations (
                        id, userId, consultantId, consultationTypeId,
                        startTime, endTime, status, paymentStatus, amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        consultationId,
                        userId,
                        consultantId,
                        consultationTypeId,
                        startDate.toISOString(),
                        endDate.toISOString(),
                        'scheduled',
                        'pending',
                        consultationType.price
                    ],
                    function (err) {
                        if (err) {
                            console.error('Error inserting consultation:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            // Create session details
            const sessionId = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO SessionDetails (
                        id, consultationId, platformDetails
                    ) VALUES (?, ?, ?)`,
                    [
                        sessionId,
                        consultationId,
                        JSON.stringify({})
                    ],
                    function (err) {
                        if (err) {
                            console.error('Error inserting session details:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            res.json({
                success: true,
                data: {
                    consultationId,
                    startTime: startDate,
                    endTime: endDate,
                    amount: consultationType.price
                }
            });
        } catch (error) {
            console.error('Error in bookConsultation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Get My Consultations
    async getMyConsultations(req, res) {
        try {
            const userId = req.user.id; // Use the authenticated user's ID

            const consultations = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT 
                        c.*,
                        ct.name as consultationType,
                        ct.sessionType,
                        ct.duration,
                        cons.name as consultantName,
                        u.name as userName,
                        sd.videoUrl,
                        sd.chatUrl,
                        sd.callUrl,
                        r.rating,
                        r.review
                    FROM Consultations c
                    JOIN ConsultationTypes ct ON c.consultationTypeId = ct.id
                    JOIN Consultants cons ON c.consultantId = cons.id
                    JOIN Users u ON cons.userId = u.id
                    LEFT JOIN SessionDetails sd ON c.id = sd.consultationId
                    LEFT JOIN Reviews r ON c.id = r.consultationId
                    WHERE c.userId = ?
                    ORDER BY c.startTime DESC`,
                    [userId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            res.json({
                success: true,
                data: consultations
            });
        } catch (error) {
            console.error('Error in getMyConsultations:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Add Review
    async addReview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { consultationId, rating, review } = req.body;
            const userId = 'u1'; // Use our test user ID

            // Verify consultation exists and belongs to user
            const consultation = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM Consultations WHERE id = ? AND userId = ? AND status = ?',
                    [consultationId, userId, 'completed'],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found or not eligible for review'
                });
            }

            // Check if review already exists
            const existingReview = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM Reviews WHERE consultationId = ?',
                    [consultationId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    error: 'Review already exists for this consultation'
                });
            }

            // Create review
            const reviewId = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO Reviews (
                        id, consultationId, rating, review,
                        isPublic, isModerated
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [reviewId, consultationId, rating, review, true, false],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Update consultant rating
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE Consultants 
                     SET rating = (
                         SELECT AVG(CAST(r.rating as FLOAT))
                         FROM Reviews r
                         JOIN Consultations c ON r.consultationId = c.id
                         WHERE c.consultantId = ?
                     ),
                     totalRatings = (
                         SELECT COUNT(r.id)
                         FROM Reviews r
                         JOIN Consultations c ON r.consultationId = c.id
                         WHERE c.consultantId = ?
                     )
                     WHERE id = ?`,
                    [consultation.consultantId, consultation.consultantId, consultation.consultantId],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({
                success: true,
                data: {
                    reviewId,
                    consultationId,
                    rating,
                    review
                }
            });
        } catch (error) {
            console.error('Error in addReview:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Add to Favorites
    async addToFavorites(req, res) {
        try {
            const { consultantId } = req.params;
            const userId = 'u1'; // Use our test user ID

            // Verify consultant exists
            const consultant = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM Consultants WHERE id = ?',
                    [consultantId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            // Add to favorites
            const favoriteId = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO FavoriteConsultants (
                        id, userId, consultantId, notifyAvailability
                    ) VALUES (?, ?, ?, ?)`,
                    [favoriteId, userId, consultantId, false],
                    function (err) {
                        if (err && err.code === 'SQLITE_CONSTRAINT') {
                            resolve(); // Already favorited
                        } else if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            res.json({
                success: true,
                message: 'Added to favorites'
            });
        } catch (error) {
            console.error('Error in addToFavorites:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Remove from Favorites
    async removeFromFavorites(req, res) {
        try {
            const { consultantId } = req.params;
            const userId = 'u1'; // Use our test user ID

            await new Promise((resolve, reject) => {
                db.run(
                    'DELETE FROM FavoriteConsultants WHERE userId = ? AND consultantId = ?',
                    [userId, consultantId],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({
                success: true,
                message: 'Removed from favorites'
            });
        } catch (error) {
            console.error('Error in removeFromFavorites:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Get Favorites
    async getFavorites(req, res) {
        try {
            const userId = 'u1'; // Use our test user ID

            const favorites = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT 
                        f.*,
                        c.*,
                        u.name as consultantName,
                        u.email as consultantEmail
                    FROM FavoriteConsultants f
                    JOIN Consultants c ON f.consultantId = c.id
                    JOIN Users u ON c.userId = u.id
                    WHERE f.userId = ?`,
                    [userId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            res.json({
                success: true,
                data: favorites
            });
        } catch (error) {
            console.error('Error in getFavorites:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Update Consultation Status
    async updateConsultationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate status
            const validStatuses = ['pending', 'in_progress', 'complete'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }

            // Check if consultation exists
            const consultation = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM Consultations WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation not found'
                });
            }

            // Update the consultation status in the database
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE Consultations SET status = ? WHERE id = ?',
                    [status, id],
                    function (err) {
                        if (err) {
                            console.error('Error updating consultation status:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            res.json({
                success: true,
                message: 'Consultation status updated successfully'
            });
        } catch (error) {
            console.error('Error in updateConsultationStatus:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};

module.exports = consultationController;