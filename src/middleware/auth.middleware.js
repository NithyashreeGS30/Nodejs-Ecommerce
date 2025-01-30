const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const authMiddleware = {
    async verifyToken(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    status: 'error',
                    message: 'No token provided'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
    }
};

module.exports = authMiddleware;