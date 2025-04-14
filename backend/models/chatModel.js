// Import Mongoose
const mongoose = require('mongoose');

// Define the schema for chat messages
const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    messages: [
        {
            sender: {
                type: String,
                enum: ['user', 'bot'],
                required: true,
            },
            content: {
                type: String,
                required: true,
            },
            source: {
                type: String, // Optional, add source information for bot messages
                default: null,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create a method to retrieve messages in the desired order
chatSchema.methods.getOrderedMessages = function () {
    return this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Create a static method to fetch conversation history
chatSchema.statics.getConversationById = async function (conversationId) {
    return this.findOne({ conversationId }).exec();
};

// Create a static method to start or continue a conversation
chatSchema.statics.startConversation = async function (userId, conversationId) {
  try {
      // Validate inputs
      if (!userId || !conversationId) {
          throw new Error('User ID and Conversation ID are required to start a conversation.');
      }

      // Convert conversationId to ObjectId if it is not already
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          throw new Error('Invalid Conversation ID format.');
      }

      // No need to generate the ObjectId again, just use the passed conversationId
      const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

      // Check if the conversation already exists
      let conversation = await this.findOne({ userId, conversationId: conversationObjectId });

      // If no conversation exists, create a new one
      if (!conversation) {
          conversation = await this.create({ userId, conversationId: conversationObjectId, messages: [] });
      }

      return conversation;
  } catch (error) {
      console.error('Error in startConversation:', error.message);
      throw new Error('Failed to start or retrieve the conversation.');
  }
};


// Compile the model
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;

// Example Usage (Node.js):
// const Chat = require('./path/to/chatModel');
//
// async function example() {
//     // Connect to MongoDB
//     await mongoose.connect('mongodb://localhost:27017/chatDB', { useNewUrlParser: true, useUnifiedTopology: true });
//
//     // Start a conversation
//     const conversation = await Chat.startConversation('userId123', 'conversationId456');
//
//     // Add messages to the conversation
//     conversation.messages.push({ sender: 'user', content: 'Hello!' });
//     conversation.messages.push({ sender: 'bot', content: 'Hi there!', source: 'KnowledgeBase' });
//     await conversation.save();
//
//     // Retrieve and display the conversation
//     const history = await Chat.getConversationById('conversationId456');
//     console.log(history.getOrderedMessages());
// }
//
// example().catch(console.error);
