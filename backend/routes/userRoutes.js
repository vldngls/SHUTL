import express from 'express';
import { registerUser, loginUser, getUserCount, getAllUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/admin/user-count', getUserCount);
router.get('/admin/users', getAllUsers);

// New route to get current user's userType based on JWT
router.get('/me', authenticateToken, (req, res) => {
    console.log("Decoded user info:", req.user); // Log to verify decoded user
    res.json({ userType: req.user.userType });
  });
  

export default router;
