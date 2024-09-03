import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';

const router = express.Router();

// @desc Register a new user
// @route POST /api/users/register
// @access Public
router.post('/register', registerUser);

// @desc Authenticate a user
// @route POST /api/users/login
// @access Public
router.post('/login', loginUser);

export default router;
