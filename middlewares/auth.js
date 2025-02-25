const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Check if the user is logged in (session exists)
        if (!req.session.user) {
            throw new Error('Not authenticated');
        }

        // Attach the user to the request object
        req.user = req.session.user;
        next();
    } catch (error) {
        res.status(401).send({ error: error.message });
    }
};

module.exports = auth;