import express from 'express';
import { 
  getChatRoom, 
  getUserChatRooms, 
  addMessage, 
  initializeChatRooms 
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/initialize', authenticateToken, initializeChatRooms);
router.get('/rooms', authenticateToken, getUserChatRooms);
router.get('/room', authenticateToken, getChatRoom);
router.post('/message', authenticateToken, addMessage);

export default router; 