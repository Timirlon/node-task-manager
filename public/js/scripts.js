const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const Task = require('./models/Task'); // Import the Task model
const User = require('./models/User'); // Import the User model

require('dotenv').config();
require('./db');
const PORT = 8000;

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URL,
            dbName: process.env.DB_NAME,
            collectionName: 'sessions',
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
        },
    })
);

// Routes
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.redirect('/register');
});

// Render Views
app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Dashboard Route
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        const user = req.session.user;

        // Fetch all tasks and populate the owner field
        const tasks = await Task.find({}).populate('owner', 'email');

        // Fetch all users (only for admin)
        let users = [];
        if (user.role === 'admin') {
            users = await User.find({});
        }

        res.render('dashboard', { user, tasks, users, currentUser: user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
