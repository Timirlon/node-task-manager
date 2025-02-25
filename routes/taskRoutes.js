const express = require('express');

const router = express.Router();
const auth = require('../middlewares/auth');
const Task = require('../models/Task')

router.get('/test',auth, (req, res) => {
    res.json({
        message: 'Task routes are working!',
        user: req.user
    });
});

// CRUD tasks for authenticated users


// Create a task
router.post('/', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id, // Use the session user's ID
        });
        await task.save();
        res.status(201).json({ task, message: 'Task Created Successfully' });
    } catch (err) {
        res.status(400).send({ error: err });
    }
});


// Fetch all tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({}).populate('owner', 'email');
        res.status(200).json({ tasks, count: tasks.length, message: 'Tasks Fetched Successfully' });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});


// Fetch a task by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('owner', 'email');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ task }); // Return the task object
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

// Update a task (Admin Only)
router.patch('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can edit tasks' });
    }

    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ task, message: 'Task Updated Successfully' });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});


// Delete a task (Admin Only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete tasks' });
    }

    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        res.json({ task, message: 'Task Deleted Successfully' });
    } catch (err) {
        res.status(500).send({ error: err });
    }
});

module.exports = router;