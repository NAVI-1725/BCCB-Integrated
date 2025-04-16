document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.querySelector('#message');
    const sendButton = document.querySelector('#sendBtn');
    const chatContainer = document.querySelector('#chatBox');
    const conversationId = document.querySelector('#conversationId').value;
    const modelToggle = document.querySelector('#modelSelection'); // Model selection button
    const responseTypeToggle = document.querySelector('#responseType');
    
    // Function to add messages to the chat container
    function addMessageToChat(sender, message, source = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    
        // Render user message as plain text, bot message as HTML
        if (sender === 'user') {
            messageElement.textContent = message;
        } else {
            messageElement.innerHTML = message; // ✅ This renders the <p>, <ul>, <li>, etc. properly
        }
    
        // Ensure proper wrapping
        messageElement.style.wordWrap = 'break-word';
        messageElement.style.whiteSpace = 'normal';
    
        chatContainer.appendChild(messageElement);
    
        // If a source is provided and it's a bot message, add the source button
        if (source && sender === 'bot') {
            const sourceWrapper = document.createElement('div');
            const sourceButton = createSourceButton(source);
            sourceWrapper.appendChild(sourceButton);
            chatContainer.appendChild(sourceWrapper);
        }
    
        // Scroll to the latest message
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }       

    function createSourceButton(source) {
        const button = document.createElement('button');
        button.textContent = 'View Source';
        button.classList.add('source-button'); // Add a CSS class for styling (optional)
        button.style.marginLeft = '10px'; // Add some margin for better spacing
        button.addEventListener('click', function () {
            alert(`Source: ${source}`);
        });
        return button;
    }

    // Function to handle the message send
    function sendMessage() {
        const userInput = chatInput.value.trim();
        const selectedModel = modelToggle.value;
        const selectedResponseType = responseTypeToggle.value;

        if (userInput) {
            addMessageToChat('user', userInput); // Display the user's message
            chatInput.value = ''; // Clear the input field
            chatInput.style.height = 'auto'; // Reset textarea height after sending

            // Send the message to the server
            fetch('/chat/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput, conversationId: conversationId, model: selectedModel, response_type: selectedResponseType }) // Fix: send 'message' instead of 'user_input'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Response received:', data); // Log the received response
                const botResponse = data.answer; // Extract bot response
                const messageSource = data.source;
                addMessageToChat('bot', botResponse, messageSource);
            })
            .catch(error => {
                console.error('Error:', error);
                addMessageToChat('bot', 'Sorry, something went wrong.'); // Show error message
            });
        } else {
            console.warn('Input is empty, not sending message.'); // Log empty input
        }
    }

    // Function to auto-resize the textarea based on its content
    function autoResizeTextarea(event) {
        const textarea = event.target;
        // Reset the height to auto to recalculate the height
        textarea.style.height = 'auto';
        // Set height based on scroll height (content height)
        textarea.style.height = textarea.scrollHeight + 'px';

        // Limit the maximum height of the textarea
        const maxHeight = 120; // Reduced max height for compact design
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto'; // Add scroll when it hits the max height
        } else {
            textarea.style.overflowY = 'hidden'; // Hide scroll when the height is less than max
        }
    }

    // Event listener for the Send button
    sendButton.addEventListener('click', function () {
        sendMessage();
    });

    // Event listener for the chat input field
    chatInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                // Shift+Enter should add a new line
                const cursorPosition = chatInput.selectionStart;
                chatInput.value = chatInput.value.slice(0, cursorPosition) + '\n' + chatInput.value.slice(cursorPosition);
                chatInput.selectionStart = chatInput.selectionEnd = cursorPosition + 1; // Move the cursor to after the newline
            } else {
                // Enter should send the message
                event.preventDefault(); // Prevent default behavior
                sendMessage();
            }
        }
    });

    // Event listener for input events to resize the textarea dynamically
    chatInput.addEventListener('input', function (event) {
        autoResizeTextarea(event);
    });

    // Initial call to set textarea size on page load
    autoResizeTextarea({ target: chatInput });
});