import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

const router = express.Router();

// @desc Register a new user
// @route POST /api/users/register
// @access Public
router.post('/register', async (req, res) => {
    const { name, email, username, password, userType } = req.body;

    try {
        // Check if the user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = await User.create({
            name,
            email,
            username,
            password: hashedPassword,
            userType
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                userType: user.userType
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Authenticate a user
// @route POST /api/users/login
// @access Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                userType: user.userType
            });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
