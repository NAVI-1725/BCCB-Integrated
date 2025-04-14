const express = require('express');
const router = express.Router();
const { 
    sendMessage, 
    getChatHistory, 
    newChat, 
    deleteChat, 
    getChatById,
    fetchChatById,
    viewChatById,
    deleteAllChats 
} = require('../controllers/chatController');

const { protect } = require('../middleware/authMiddleware'); // Middleware to protect routes

// Protected routes
// Route for sending a message to the chat
router.post('/send_message', protect, sendMessage);

// Route to create a new chat session (render a new chat page or initiate a conversation)
router.get('/new', protect, newChat);

// Route to fetch chat history for a user
router.get('/history', protect, getChatHistory);

// Route to fetch a specific chat by ID and continue the conversation
router.get('/:id', protect, getChatById);

// Route to delete a specific chat by ID
router.post('/delete/:id', protect, deleteChat);

// Route to delete all chats for a user
router.post('/delete-all', protect, deleteAllChats);


module.exports = router;
