const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middlewares/auth');

// Fetch a user by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user }); // Return the user object
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if the email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already in use' });
        }

        // Create a new user
        const user = new User({ name, email, password, role });
        await user.save();

        // Automatically log in the user after registration
        req.session.user = user;
        res.status(201).json({ user, message: 'User registered and logged in successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Store user data in the session
        req.session.user = user;
        res.json({ user, message: 'Logged in successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Logout a user
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logged out successfully' });
    });
});

// Fetch all users (Admin Only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view users' });
    }

    try {
        const users = await User.find({});
        res.json({ users, message: 'Users Fetched Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user (Admin Only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can edit users' });
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ user, message: 'User Updated Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user (Admin Only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete users' });
    }

    try {
        // Delete the user
        const user = await User.findByIdAndDelete(req.params.id);

        // Delete all tasks owned by the user
        await Task.deleteMany({ owner: req.params.id });

        res.json({ user, message: 'User and their tasks deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;