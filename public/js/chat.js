// chat.js - ChatGPT Integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat script loading...');
    
    // Force create chat elements if they don't exist
    setTimeout(() => {
        createChatElements();
        initializeChat();
    }, 500);
    
    function createChatElements() {
        // Check if chat window exists, if not create it
        if (!document.getElementById('chatgpt-window')) {
            const chatWindow = document.createElement('div');
            chatWindow.id = 'chatgpt-window';
            chatWindow.className = 'chatgpt-window';
            chatWindow.innerHTML = `
                <div class="chat-header">
                    <div class="chat-title">
                        <span class="chat-icon">🤖</span>
                        <h3>ChatGPT Assistant</h3>
                    </div>
                    <div class="chat-controls">
                        <button id="minimize-chat" class="chat-btn minimize-btn">−</button>
                        <button id="close-chat" class="chat-btn close-btn">×</button>
                    </div>
                </div>
                <div class="chat-body">
                    <div id="chat-messages" class="chat-messages">
                        <div class="message assistant-message">
                            <div class="message-content">
                                <strong>ChatGPT:</strong> Hello! I'm here to help you with any questions about stocks, trading, market analysis, or anything else. What would you like to know?
                            </div>
                            <div class="message-time">Just now</div>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Ask ChatGPT anything..." />
                        <button id="send-message" class="send-btn">
                            <span>Send</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(chatWindow);
        }
        
        // Check if chat toggle exists, if not create it
        if (!document.getElementById('chat-toggle')) {
            const chatToggle = document.createElement('button');
            chatToggle.id = 'chat-toggle';
            chatToggle.className = 'chat-toggle';
            chatToggle.innerHTML = `
                <span class="chat-icon">💬</span>
                <span class="chat-text">Chat with AI</span>
            `;
            document.body.appendChild(chatToggle);
        }
        
        console.log('Chat elements created/verified');
    
    // Initialize chat
    function initializeChat() {
        console.log('Initializing chat...');
        
        // Get chat elements (they should exist now)
        const chatToggle = document.getElementById('chat-toggle');
        const chatWindow = document.getElementById('chatgpt-window');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        const chatMessages = document.getElementById('chat-messages');
        const minimizeBtn = document.getElementById('minimize-chat');
        const closeBtn = document.getElementById('close-chat');
        
        if (!chatToggle || !chatWindow) {
            console.error('Chat elements not found!');
            return;
        }
        
        console.log('Chat elements found, setting up...');
        
        // Chat state
        let isOpen = false;
        let isMinimized = false;
        let conversationHistory = [];
        
        // Add welcome message to history
        conversationHistory.push({
            role: 'assistant',
            content: "Hello! I'm here to help you with any questions about stocks, trading, market analysis, or anything else. What would you like to know?"
        });
        
        // Event listeners
        if (chatToggle) chatToggle.addEventListener('click', toggleChat);
        if (sendButton) sendButton.addEventListener('click', sendMessage);
        if (chatInput) chatInput.addEventListener('keypress', handleKeyPress);
        if (minimizeBtn) minimizeBtn.addEventListener('click', minimizeChat);
        if (closeBtn) closeBtn.addEventListener('click', closeChat);
        
        // Initially hidden
        if (chatWindow) chatWindow.style.display = 'none';
        
        console.log('Chat initialized successfully!');
    
    // Toggle chat window
    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }
    
    // Open chat window
    function openChat() {
        chatWindow.style.display = 'block';
        chatWindow.classList.add('chat-open');
        chatWindow.classList.remove('chat-minimized');
        isOpen = true;
        isMinimized = false;
        chatToggle.style.display = 'none';
        
        // Focus on input
        setTimeout(() => {
            chatInput.focus();
        }, 100);
    }
    
    // Close chat window
    function closeChat() {
        chatWindow.style.display = 'none';
        chatWindow.classList.remove('chat-open', 'chat-minimized');
        isOpen = false;
        isMinimized = false;
        chatToggle.style.display = 'flex';
    }
    
    // Minimize chat window
    function minimizeChat() {
        chatWindow.classList.add('chat-minimized');
        isMinimized = true;
        chatToggle.style.display = 'flex';
        chatToggle.innerHTML = `
            <span class="chat-icon">💬</span>
            <span class="chat-text">Resume Chat</span>
        `;
    }
    
    // Handle key press in input
    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    // Send message to ChatGPT
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Clear input
        chatInput.value = '';
        
        // Add user message to chat
        addMessage('user', message);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Show typing indicator
        const typingId = addTypingIndicator();
        
        try {
            // Send to ChatGPT API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: conversationHistory
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response from ChatGPT');
            }
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingId);
            
            // Add assistant response
            addMessage('assistant', data.response);
            
            // Add to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: data.response
            });
            
        } catch (error) {
            console.error('Chat error:', error);
            
            // Remove typing indicator
            removeTypingIndicator(typingId);
            
            // Add error message
            addMessage('assistant', "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.");
        }
    }
    
    // Add message to chat
    function addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <strong>${sender === 'user' ? 'You' : 'ChatGPT'}:</strong> ${content}
            </div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-' + Date.now();
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <strong>ChatGPT:</strong> <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return typingDiv.id;
    }
    
    // Remove typing indicator
    function removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    // Initialize when DOM is ready
    initializeChat();
});

