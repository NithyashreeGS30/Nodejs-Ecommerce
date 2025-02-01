// checkActive.middleware.js
const { db } = require('../config/database');

const checkActiveMiddleware = {
    async verifyActive(req, res, next) {
        try {
            // Get the email from the request body
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email is required'
                });
            }

            // Check user's active status in the database
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT isActive FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            // If user not found or inactive
            if (!user.isActive) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account is deactivated. Contact support or reactivate your account.'
                });
            }

            next();
        } catch (error) {
            console.error('Error checking active status:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error while checking account status'
            });
        }
    }
};

module.exports = checkActiveMiddleware;
