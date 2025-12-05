// Configuration
let config = {
    apiUrl: 'https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328',
    temperature: 1
};

// State
let currentFile = null;
let conversationHistory = [];

// Load saved settings
function loadSettings() {
    const savedApiUrl = localStorage.getItem('apiUrl');
    const savedTemp = localStorage.getItem('temperature');
    const savedNightMode = localStorage.getItem('nightMode');

    if (savedApiUrl) {
        config.apiUrl = savedApiUrl;
        document.getElementById('apiUrl').value = savedApiUrl;
    }
    if (savedTemp) {
        config.temperature = parseFloat(savedTemp);
        document.getElementById('modelTemp').value = savedTemp;
        document.getElementById('tempValue').textContent = savedTemp;
    }
    if (savedNightMode === 'true') {
        document.body.classList.add('night-mode');
    }
}

// Toggle night mode
function toggleNightMode() {
    document.body.classList.toggle('night-mode');
    const isNightMode = document.body.classList.contains('night-mode');
    localStorage.setItem('nightMode', isNightMode);
}

// Save settings
function saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value;
    const temp = document.getElementById('modelTemp').value;

    config.apiUrl = apiUrl;
    config.temperature = parseFloat(temp);

    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('temperature', temp);

    toggleSettings();
    showNotification('Pengaturan berhasil disimpan!');
}

// Toggle settings modal
function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

// Update temperature value display
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const tempSlider = document.getElementById('modelTemp');
    const tempValue = document.getElementById('tempValue');

    tempSlider.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });
});

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Handle key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        currentFile = file;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('filePreview').style.display = 'flex';
    }
}

// Remove file
function removeFile() {
    currentFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').style.display = 'none';
}

// Add message to chat
function addMessage(text, isUser = false, timestamp = new Date()) {
    const chatMessages = document.getElementById('chatMessages');

    // Remove welcome message if exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';

    if (isUser) {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    } else {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(timestamp);

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeSpan);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format time
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Show typing indicator
function showTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'flex';
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

// Show notification
function showNotification(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message && !currentFile) return;

    // Add user message
    if (message) {
        addMessage(message, true);
        conversationHistory.push({
            role: 'user',
            content: message
        });
    }

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    showTypingIndicator();

    try {
        // Prepare request data
        const formData = new FormData();
        formData.append('message', message);
        formData.append('temperature', config.temperature);
        formData.append('history', JSON.stringify(conversationHistory));

        if (currentFile) {
            formData.append('file', currentFile);
            removeFile();
        }

        // Send to API
        let options = {
            method: 'POST',
        };

        if (currentFile) {
            options.body = formData;
        } else {
            options.headers = {
                'Content-Type': 'application/json'
            };
            options.body = JSON.stringify({
                message: message,
                temperature: config.temperature,
                history: conversationHistory
            });
        }

        const response = await fetch(config.apiUrl, options);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Hide typing indicator
        hideTypingIndicator();

        // Add AI response
        const aiResponse = data.response || data.message || 'Maaf, saya tidak dapat memproses permintaan Anda.';
        addMessage(aiResponse, false);

        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();

        // Show error message
        addMessage('Maaf, terjadi kesalahan. Pastikan API URL sudah dikonfigurasi dengan benar di pengaturan.', false);

        // If API is not configured, show settings
        if (!config.apiUrl || config.apiUrl === '') {
            setTimeout(() => {
                showNotification('Silakan konfigurasi API URL di pengaturan');
                toggleSettings();
            }, 1000);
        }
    }
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (e.target === modal) {
        toggleSettings();
    }
});
