/**
 * Utility functions for the Tic Tac Toe game
 */

// Generate a random room ID for multiplayer
function generateRoomId(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Save nickname to localStorage
function saveNickname(nickname) {
    localStorage.setItem('neon-ttt-nickname', nickname);
    return nickname;
}

// Get nickname from localStorage
function getNickname() {
    return localStorage.getItem('neon-ttt-nickname');
}

// Copy text to clipboard
function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => resolve(true))
                .catch(() => {
                    fallbackCopyToClipboard(text);
                    resolve(true);
                });
        } else {
            fallbackCopyToClipboard(text);
            resolve(true);
        }
    });
}

// Fallback method for copying to clipboard
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    
    document.body.removeChild(textArea);
}

// Get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Parse room ID from URL
function getRoomIdFromUrl() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    
    if (pathParts.length >= 3 && pathParts[1] === 'room') {
        return pathParts[2];
    }
    
    const params = getUrlParams();
    return params.room || null;
}

// Play sound effect
function playSound(name) {
    // Sound disabled by default - can be implemented later
    const soundsEnabled = localStorage.getItem('neon-ttt-sounds') === 'true';
    if (!soundsEnabled) return;
    
    const sound = new Audio(`sounds/${name}.mp3`);
    sound.volume = 0.5;
    sound.play().catch(err => console.log('Error playing sound:', err));
}

// Helper to show/hide elements
function toggleElementVisibility(selector, visible) {
    const element = document.querySelector(selector);
    if (element) {
        if (visible) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}

// Show a temporary message
function showTemporaryMessage(message, duration = 2000) {
    const messageElement = document.getElementById('status-message');
    const originalMessage = messageElement.textContent;
    
    messageElement.textContent = message;
    
    setTimeout(() => {
        messageElement.textContent = originalMessage;
    }, duration);
}

// Add animation class and remove after animation completes
function addTemporaryClass(element, className, duration = 1000) {
    element.classList.add(className);
    
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

// Export the utility functions
window.GameUtils = {
    generateRoomId,
    saveNickname,
    getNickname,
    copyToClipboard,
    getUrlParams,
    getRoomIdFromUrl,
    playSound,
    toggleElementVisibility,
    showTemporaryMessage,
    addTemporaryClass
}; 