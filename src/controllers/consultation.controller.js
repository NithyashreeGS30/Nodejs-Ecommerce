/*I've rewritten the consultation controller with a simpler, more focused implementation. The key changes include:

Removed complex dependencies (Razorpay, nodemailer) to focus on core functionality first
Simplified error handling and response formats
Focused on essential CRUD operations
Improved SQL queries for better performance
Consistent error response format
Added basic analytics functionality
The controller now includes these main functionalities:

Browse and search consultants
Get consultant details
Get consultant availability
Book consultations
View consultations
Add reviews
Manage favorites
View analytics
Would you like me to add any specific functionality or make any modifications to the current implementation?*/


const { validationResult } = require('express-validator');
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const consultationController = {
    // Browse and Search Consultants
    async browseConsultants(req, res) {
        try {
            console.log('Received query params:', req.query);
            
            const {
                expertise,
                language,
                rating,
                availability_date,
                availability_start_time,
                availability_end_time,
                min_experience,
                max_price,
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            let query = `
                WITH ConsultantAvailability AS (
                    SELECT 
                        consultant_id,
                        COUNT(CASE 
                            WHEN date = ? 
                            AND start_time >= ?
                            AND end_time <= ?
                            AND is_booked = 0
                            THEN 1 END
                        ) as available_slots
                    FROM consultant_availability
                    GROUP BY consultant_id
                )
                SELECT 
                    c.*,
                    u.name,
                    u.email,
                    COALESCE(ca.available_slots, 0) as available_slots,
                    (
                        SELECT COUNT(r.id) 
                        FROM reviews r 
                        WHERE r.consultation_id IN (
                            SELECT id FROM consultations WHERE consultant_id = c.id
                        )
                    ) as review_count,
                    (
                        SELECT AVG(CAST(r.rating as FLOAT)) 
                        FROM reviews r 
                        WHERE r.consultation_id IN (
                            SELECT id FROM consultations WHERE consultant_id = c.id
                        )
                    ) as average_rating
                FROM consultants c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN ConsultantAvailability ca ON ca.consultant_id = c.id
                WHERE c.is_active = 1
            `;

            const params = [
                availability_date || null,
                availability_start_time || null,
                availability_end_time || null
            ];

            if (expertise) {
                query += ` AND c.expertise LIKE ?`;
                params.push(`%${expertise}%`);
            }

            if (language) {
                query += ` AND c.languages LIKE ?`;
                params.push(`%${language}%`);
            }

            if (rating) {
                query += ` AND (
                    SELECT AVG(CAST(r.rating as FLOAT)) 
                    FROM reviews r 
                    WHERE r.consultation_id IN (
                        SELECT id FROM consultations WHERE consultant_id = c.id
                    )
                ) >= ?`;
                params.push(rating);
            }

            if (availability_date && availability_start_time && availability_end_time) {
                query += ` AND ca.available_slots > 0`;
            }

            // Add sorting
            query += ` ORDER BY 
                CASE 
                    WHEN ? IS NOT NULL THEN ca.available_slots 
                    ELSE COALESCE(average_rating, 0)
                END DESC,
                c.hourly_rate ASC
            `;
            params.push(availability_date);

            // Add pagination
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            console.log('Executing query:', query);
            console.log('With params:', params);

            const consultants = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        reject(err);
                    }
                    console.log('Query results:', rows);
                    resolve(rows);
                });
            });

            // Get total count for pagination
            const countQuery = `
                SELECT COUNT(*) as total
                FROM consultants c
                WHERE c.is_active = 1
                ${expertise ? 'AND c.expertise LIKE ?' : ''}
                ${language ? 'AND c.languages LIKE ?' : ''}
            `;

            const countParams = [];
            if (expertise) countParams.push(`%${expertise}%`);
            if (language) countParams.push(`%${language}%`);

            const totalCount = await new Promise((resolve, reject) => {
                db.get(countQuery, countParams, (err, row) => {
                    if (err) {
                        console.error('Error getting count:', err);
                        reject(err);
                    }
                    resolve(row.total);
                });
            });

            res.json({
                success: true,
                data: {
                    consultants,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(totalCount / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Detailed error in browseConsultants:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to retrieve consultants',
                details: error.message 
            });
        }
    },

    // Get Consultant Details
    async getConsultantDetails(req, res) {
        try {
            const { id } = req.params;

            const consultant = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT 
                        c.*,
                        u.name,
                        u.email,
                        (SELECT AVG(rating) FROM reviews r 
                         JOIN consultations cons ON r.consultation_id = cons.id 
                         WHERE cons.consultant_id = c.id) as average_rating
                    FROM consultants c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.id = ?
                `, [id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultant) {
                return res.status(404).json({ success: false, error: 'Consultant not found' });
            }

            res.json({ success: true, data: consultant });
        } catch (error) {
            console.error('Error getting consultant details:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve consultant details' });
        }
    },

    // Get Consultant Availability
    async getConsultantAvailability(req, res) {
        try {
            const { id } = req.params;
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Both start_date and end_date are required'
                });
            }

            // First check if consultant exists
            const consultant = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM consultants WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            const availability = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        ca.*,
                        c.expertise,
                        c.languages,
                        c.hourly_rate,
                        u.name as consultant_name
                    FROM consultant_availability ca
                    JOIN consultants c ON ca.consultant_id = c.id
                    JOIN users u ON c.user_id = u.id
                    WHERE ca.consultant_id = ?
                    AND ca.date BETWEEN ? AND ?
                    ORDER BY ca.date, ca.start_time
                `, [id, start_date, end_date], (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            console.log(`Found ${availability.length} availability slots for consultant ${id}`);

            res.json({
                success: true,
                data: {
                    consultant: {
                        id: consultant.id,
                        expertise: consultant.expertise,
                        languages: consultant.languages,
                        hourly_rate: consultant.hourly_rate
                    },
                    availability: availability
                }
            });
        } catch (error) {
            console.error('Error getting availability:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve availability' });
        }
    },

    // Book Consultation
    async bookConsultation(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required. Please login.'
                });
            }

            const { consultant_id, consultation_type_id, scheduled_start_time } = req.body;
            const user_id = req.user.id;

            // Validate consultant exists
            const consultant = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM consultants WHERE id = ?', [consultant_id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            // Validate consultation type exists
            const consultationType = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM consultation_types WHERE id = ?', [consultation_type_id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultationType) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation type not found'
                });
            }

            // Check if the consultant is available at the requested time
            const scheduledDate = new Date(scheduled_start_time).toISOString().split('T')[0];
            const scheduledTime = new Date(scheduled_start_time).toTimeString().split(' ')[0];

            const availability = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT * FROM consultant_availability 
                    WHERE consultant_id = ? 
                    AND date = ? 
                    AND start_time <= ? 
                    AND end_time > ?
                    AND is_booked = 0
                `, [consultant_id, scheduledDate, scheduledTime, scheduledTime], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!availability) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected time slot is not available'
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
                // Create consultation
                const consultationId = uuidv4();
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO consultations (id, consultant_id, user_id, consultation_type_id, scheduled_start_time) VALUES (?, ?, ?, ?, ?)',
                        [consultationId, consultant_id, user_id, consultation_type_id, scheduled_start_time],
                        (err) => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });

                // Mark availability as booked
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE consultant_availability SET is_booked = 1 WHERE id = ?',
                        [availability.id],
                        (err) => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });

                // Commit transaction
                await new Promise((resolve, reject) => {
                    db.run('COMMIT', err => {
                        if (err) reject(err);
                        resolve();
                    });
                });

                res.json({
                    success: true,
                    data: {
                        consultation_id: consultationId,
                        consultant_id,
                        consultation_type: consultationType.name,
                        scheduled_start_time,
                        duration: consultationType.duration
                    }
                });
            } catch (error) {
                // Rollback transaction on error
                await new Promise((resolve) => {
                    db.run('ROLLBACK', () => resolve());
                });
                throw error;
            }
        } catch (error) {
            console.error('Error booking consultation:', error);
            res.status(500).json({ success: false, error: 'Failed to book consultation' });
        }
    },

    // Get My Consultations
    async getMyConsultations(req, res) {
        try {
            const { status } = req.query;
            const user_id = req.user.id;

            let query = `
                SELECT 
                    c.*,
                    ct.name as consultation_type,
                    u.name as consultant_name
                FROM consultations c
                JOIN consultation_types ct ON c.consultation_type_id = ct.id
                JOIN consultants cons ON c.consultant_id = cons.id
                JOIN users u ON cons.user_id = u.id
                WHERE c.user_id = ?
            `;

            const params = [user_id];

            if (status) {
                query += ` AND c.status = ?`;
                params.push(status);
            }

            query += ` ORDER BY c.scheduled_start_time DESC`;

            const consultations = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            res.json({ success: true, data: consultations });
        } catch (error) {
            console.error('Error getting consultations:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve consultations' });
        }
    },

    // Add Review
    async addReview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { consultation_id, rating, comment } = req.body;
            const user_id = req.user.id;

            // Verify consultation exists and belongs to user
            const consultation = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT c.*, ct.name as consultation_type, ct.duration,
                           cons.expertise, u.name as consultant_name
                    FROM consultations c
                    JOIN consultation_types ct ON c.consultation_type_id = ct.id
                    JOIN consultants cons ON c.consultant_id = cons.id
                    JOIN users u ON cons.user_id = u.id
                    WHERE c.id = ? AND c.user_id = ?
                `, [consultation_id, user_id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultation not found or not eligible for review'
                });
            }

            // Check if review already exists
            const existingReview = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM reviews WHERE consultation_id = ?', [consultation_id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    error: 'Review already exists for this consultation'
                });
            }

            // Add review
            const review_id = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO reviews (
                        id, consultation_id, user_id, rating, comment,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [review_id, consultation_id, user_id, rating, comment],
                    err => {
                        if (err) reject(err);
                        resolve();
                    });
            });

            res.status(201).json({
                success: true,
                data: {
                    review_id,
                    consultation: {
                        id: consultation.id,
                        type: consultation.consultation_type,
                        consultant_name: consultation.consultant_name,
                        expertise: consultation.expertise,
                        scheduled_start_time: consultation.scheduled_start_time,
                        duration: consultation.duration
                    },
                    rating,
                    comment
                },
                message: 'Review added successfully'
            });
        } catch (error) {
            console.error('Error adding review:', error);
            res.status(500).json({ success: false, error: 'Failed to add review' });
        }
    },

    // Add to Favorites
    async addToFavorites(req, res) {
        try {
            const { consultantId } = req.params;
            const user_id = req.user.id;

            // Check if consultant exists
            const consultant = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM consultants WHERE id = ?', [consultantId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!consultant) {
                return res.status(404).json({
                    success: false,
                    error: 'Consultant not found'
                });
            }

            // Add to favorites with a unique ID
            const favorite_id = uuidv4();
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO favorites (
                        id, user_id, consultant_id, created_at
                    ) VALUES (?, ?, ?, datetime('now'))
                `, [favorite_id, user_id, consultantId], (err) => {
                    if (err && err.code === 'SQLITE_CONSTRAINT') {
                        // If unique constraint fails, the favorite already exists
                        resolve({ alreadyExists: true });
                    } else if (err) {
                        reject(err);
                    } else {
                        resolve({ alreadyExists: false });
                    }
                });
            });

            res.json({
                success: true,
                message: 'Added to favorites successfully'
            });
        } catch (error) {
            console.error('Error adding to favorites:', error);
            res.status(500).json({ success: false, error: 'Failed to add to favorites' });
        }
    },

    // Remove from Favorites
    async removeFromFavorites(req, res) {
        try {
            const { consultantId } = req.params;
            const user_id = req.user.id;

            const result = await new Promise((resolve, reject) => {
                db.run(
                    'DELETE FROM favorites WHERE user_id = ? AND consultant_id = ?',
                    [user_id, consultantId],
                    function(err) {
                        if (err) reject(err);
                        resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Favorite not found'
                });
            }

            res.json({
                success: true,
                message: 'Removed from favorites successfully'
            });
        } catch (error) {
            console.error('Error removing from favorites:', error);
            res.status(500).json({ success: false, error: 'Failed to remove from favorites' });
        }
    },

    // Get Favorites
    async getFavorites(req, res) {
        try {
            const user_id = req.user.id;

            const favorites = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        f.id as favorite_id,
                        c.*,
                        u.name as consultant_name,
                        u.email as consultant_email
                    FROM favorites f
                    JOIN consultants c ON f.consultant_id = c.id
                    JOIN users u ON c.user_id = u.id
                    WHERE f.user_id = ?
                `, [user_id], (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            res.json({
                success: true,
                data: favorites
            });
        } catch (error) {
            console.error('Error getting favorites:', error);
            res.status(500).json({ success: false, error: 'Failed to get favorites' });
        }
    },

    // Get Analytics
    async getAnalytics(req, res) {
        try {
            const { start_date, end_date, consultant_id } = req.query;

            let query = `
                SELECT 
                    COUNT(*) as total_consultations,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_consultations,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_consultations,
                    AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END) as average_rating
                FROM consultations c
                LEFT JOIN reviews r ON c.id = r.consultation_id
                WHERE 1=1
            `;

            const params = [];

            if (start_date) {
                query += ` AND c.scheduled_start_time >= ?`;
                params.push(start_date);
            }

            if (end_date) {
                query += ` AND c.scheduled_start_time <= ?`;
                params.push(end_date);
            }

            if (consultant_id) {
                query += ` AND c.consultant_id = ?`;
                params.push(consultant_id);
            }

            const analytics = await new Promise((resolve, reject) => {
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            res.json({ success: true, data: analytics });
        } catch (error) {
            console.error('Error getting analytics:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve analytics' });
        }
    }
};

module.exports = consultationController;