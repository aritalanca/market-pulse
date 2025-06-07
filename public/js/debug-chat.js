// Debug script to check chat button visibility
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking chat button...');
    
    setTimeout(() => {
        const chatToggle = document.getElementById('chat-toggle');
        console.log('Chat toggle element:', chatToggle);
        
        if (chatToggle) {
            console.log('Chat toggle found!');
            console.log('Display:', window.getComputedStyle(chatToggle).display);
            console.log('Visibility:', window.getComputedStyle(chatToggle).visibility);
            console.log('Z-index:', window.getComputedStyle(chatToggle).zIndex);
            console.log('Position:', window.getComputedStyle(chatToggle).position);
            console.log('Bottom:', window.getComputedStyle(chatToggle).bottom);
            console.log('Right:', window.getComputedStyle(chatToggle).right);
        } else {
            console.log('Chat toggle NOT found!');
        }
        
        // Force show the button
        if (chatToggle) {
            chatToggle.style.display = 'flex';
            chatToggle.style.position = 'fixed';
            chatToggle.style.bottom = '30px';
            chatToggle.style.right = '30px';
            chatToggle.style.zIndex = '9999';
            chatToggle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            chatToggle.style.color = 'white';
            chatToggle.style.border = 'none';
            chatToggle.style.padding = '15px 25px';
            chatToggle.style.borderRadius = '50px';
            chatToggle.style.cursor = 'pointer';
            console.log('Chat button styles forced!');
        }
    }, 1000);
});

