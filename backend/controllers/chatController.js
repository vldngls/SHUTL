import ChatRoom from '../models/chat.model.js';
import User from '../models/user.model.js';

export const initializeChatRooms = async (req, res) => {
  try {
    const existingRoom = await ChatRoom.findOne({ isGlobalRoom: true });
    
    if (!existingRoom) {
      const globalRoom = new ChatRoom({
        isGlobalRoom: true,
        messages: []
      });
      
      await globalRoom.save();
      console.log('Created global chat room:', globalRoom._id);
      return res.json(globalRoom);
    }
    
    console.log('Found existing global room:', existingRoom._id);
    return res.json(existingRoom);
  } catch (error) {
    console.error('Error in initializeChatRooms:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get or create chat room between driver and teller
export const getChatRoom = async (req, res) => {
  try {
    const { driverEmail, tellerEmail } = req.query;
    
    let chatRoom = await ChatRoom.findOne({
      'driver.email': driverEmail,
      'teller.email': tellerEmail
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        driver: { email: driverEmail },
        teller: { email: tellerEmail }
      });
      await chatRoom.save();
    }

    res.json(chatRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all chat rooms for a user
export const getUserChatRooms = async (req, res) => {
  try {
    const { email, userType } = req.query;
    console.log('Getting chat rooms for:', { email, userType });

    const globalRoom = await ChatRoom.findOne({ isGlobalRoom: true });
    res.json(globalRoom ? [globalRoom] : []);
  } catch (error) {
    console.error('Error in getUserChatRooms:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add message to chat room
export const addMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    
    if (!roomId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    chatRoom.messages.push(message);
    chatRoom.lastMessage = new Date();
    await chatRoom.save();

    res.json(chatRoom);
  } catch (error) {
    console.error('Error in addMessage:', error);
    res.status(500).json({ error: error.message });
  }
}; 