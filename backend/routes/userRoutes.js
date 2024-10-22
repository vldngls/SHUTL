import express from 'express';
import { registerUser, loginUser, getUserCount, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

// Route to register a new user
router.post('/register', registerUser);

// Route to login a user
router.post('/login', loginUser);  // Ensure this line exists

// Route to get user count for admin dashboard
router.get('/admin/user-count', getUserCount);

// Route for fetching all users
router.get('/admin/users', getAllUsers);

export default router;
