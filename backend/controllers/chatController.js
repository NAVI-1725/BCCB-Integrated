const axios = require('axios');
const User = require('../models/userModel');
const Chat = require('../models/chatModel'); // Ensure the correct model path
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Send a Message
exports.sendMessage = async (req, res) => {
  try {
    const userMessage = req.body.message;  // Extract message from the request body
    const model = req.body.model || "gemini";  
    const responseType = req.body.response_type || "brief"; 
    const userId = req.user.id;  // Assuming user ID is in the JWT token
    
    // Ensure message is provided
    if (!userMessage || userMessage.trim() === '') {
      return res.status(400).json({ success: false, error: "Message cannot be empty." });
    }

    const conversationId = req.body.conversationId; // Get conversationId from the request body

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID is required.",
      });
    }

    // Fetch or create a conversation
    let conversation = await Chat.startConversation(userId, conversationId);

    // Forward the message to the Python server
    const pythonServerUrl = 'http://127.0.0.1:5050/process_message'; // Adjust the URL as necessary
    const pythonResponse = await axios.post(pythonServerUrl, {
      user_input: userMessage, 
      model: model,
      response_type: responseType  // Forward the message to Python server
    });

    // Get the response from Python and save the conversation
    if (pythonResponse.data.answer) {
      conversation.messages.push({ sender: 'user', content: userMessage });
      conversation.messages.push({ sender: 'bot', content: pythonResponse.data.answer, source: pythonResponse.data.source });
      await conversation.save();
      
      return res.json({
        success: true,
        answer: pythonResponse.data.answer,  // Return the bot's answer
        source: pythonResponse.data.source  // Return the source if available
      });
    } else {
      return res.status(500).json({
        success: false,
        answer: "Sorry! Something went wrong",  // Return the bot's answer
        source: "Internal Server Error" // Return the source if available
      });
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      answer: "Sorry! Something went wrong",
      source: "Internal Server Error"
    });
  }
};

// Fetch chat history for a user
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is authenticated
    if (!userId) {
      return res.status(400).send('User ID is missing. Ensure authentication is working.');
    }

    // Fetch chats specific to the user
    const chatHistory = await Chat.find({ userId }).sort({ updatedAt: -1 });

    if (!chatHistory || chatHistory.length === 0) {
      console.log("No chat history found for user:", userId);
      return res.render('users/history', { chatHistory: [] }); // Send empty history to the view
    }

    // Render the history page with user-specific chat history
    res.render('users/history', { chatHistory });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).send('Error retrieving chat history.');
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findByIdAndDelete(chatId);
    if (!chat) {
      return res.status(404).send('Chat not found.');
    }
    res.json({ success: true }); // Return success status
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).send('Error deleting chat.');
  }
};

exports.deleteAllChats = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is authenticated
    const result = await Chat.deleteMany({ userId }); // Delete all chats for the authenticated user
    if (result.deletedCount === 0) {
      return res.status(404).send('No chats found to delete.');
    }
    res.json({ success: true }); // Return success status
  } catch (err) {
    console.error('Error deleting all chats:', err);
    res.status(500).send('Error deleting all chats.');
  }
};

// Continue a chat by rendering the chat page with its history
// Continue a chat by rendering the chat page with its history
exports.getChatById = async (req, res) => {
  try {
    const chatId = req.params.id;
    console.log(chatId);
    const chat = await Chat.findById(chatId); // Fetch the chat based on the provided ID
    
    if (!chat) {
      return res.status(404).send('Chat not found.');
    }

    // Assuming `conversationId` is part of the `Chat` model or should be set separately
    const conversationId = chat.conversationId;
    console.log(conversationId) // Or fetch conversationId from the chat, if it's a separate field

    // Render the prev_chat.ejs page with chatId, conversationId, and messages
    res.render('users/prev_chat', { conversationId, messages: chat.messages });
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.status(500).send('Error retrieving chat.');
  }
};

exports.viewChatById = async (req, res) => {
  try {
    const chatId = req.params.id;

    // Fetch the chat by ID
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).send('Chat not found.');
    }

    // Render the prev_chat.ejs file with the chat's messages
    res.render('users/prev_chat', { messages: chat.messages });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).send('Server Error');
  }
};


// Render New Chat Page
exports.newChat = async (req, res) => {
  try {
    console.log("New chat page requested");

    const userId = req.user.id; // Assuming user ID is available in the request
    const conversationId = new mongoose.Types.ObjectId(); // Generate a new conversation ID

    // Fetch or create a conversation
    const conversation = await Chat.startConversation(userId, conversationId);

    // Render the chat page, passing the conversation ID to the frontend
    res.render('users/chat', { conversationId });
  } catch (error) {
    console.error("Error in newChat:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to start a new chat. Please try again later.",
    });
  }
};

// Optional: Get All Chats (Admin Feature)
exports.getAllChats = async (req, res) => {
  try {
    const allChats = await Chat.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, allChats });
  } catch (error) {
    console.error("Error in getAllChats:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve all chats. Please try again later."
    });
  }
};
