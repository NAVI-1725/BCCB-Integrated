document.addEventListener('DOMContentLoaded', () => {
    // Select all delete buttons for individual chats
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    // Attach event listeners to each delete button (for individual chat)
    deleteButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const chatId = event.target.closest('.delete-btn').getAttribute('data-chat-id');
        if (confirm('Are you sure you want to delete this chat?')) {
          deleteChat(chatId);
        }
      });
    });
  
    // Handle the 'Delete All' functionality
    const deleteAllInput = document.getElementById('deleteAllInput');
    const deleteAllButton = document.querySelector('button[onclick="showDeleteAllInput()"]'); // Get the "Delete All" button
    console.log("Delete all function is getting called");
  
    deleteAllInput.addEventListener('input', function() {
      if (deleteAllInput.value.trim().toLowerCase() === 'delete all') {
        deleteAllInput.classList.add('bg-green-200');
      } else {
        deleteAllInput.classList.remove('bg-green-200');
      }
    });
  
    // Event listener for 'Delete All' action when pressing Enter
    deleteAllInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter' && deleteAllInput.value.trim().toLowerCase() === 'delete all') {
        if (confirm('Are you sure you want to delete all chats?')) {
          deleteAllChats();
        }
      }
    });
  
    // Add event listener to the "Delete All" button (on click)
    deleteAllButton.addEventListener('click', function() {
      if (deleteAllInput.value.trim().toLowerCase() === 'delete all') {
        if (confirm('Are you sure you want to delete all chats?')) {
          deleteAllChats();
        }
      } else {
        alert('Please type "DELETE ALL" to confirm.');
      }
    });

    // Function to delete a single chat
    function deleteChat(chatId) {
      fetch(`/chat/delete/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // or get token from session
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Chat deleted successfully!');
          location.reload();  // Reload the page to refresh the chat list
        } else {
          alert('Failed to delete the chat');
        }
      })
      .catch(err => alert('Error deleting chat'));
    }
  
    // Function to delete all chats
    function deleteAllChats() {
      fetch('/chat/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // or get token from session
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('All chats deleted successfully!');
          location.reload();  // Reload the page to refresh the chat list
        } else {
          alert('Failed to delete all chats');
        }
      })
      .catch(err => alert('Error deleting all chats'));
    }
  });
