import { db, currentUser, isAdmin } from './firebase-config.js';
import { usersRef } from './auth.js';

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const userList = document.getElementById('userList');

// Chat State
let lastMessageTime = 0;
let messageCount = 0;
const messageCooldown = 1000;
const spamThreshold = 5;
const bannedWords = ['badword1', 'badword2'];

// Database References
const messagesRef = db.ref('messages');
const typingRef = db.ref('typing');

// Initialize chat
export function initChat() {
  setupChatEventListeners();
  loadMessages();
  setupUserList();
  setupTypingListener();
}

// Setup event listeners
function setupChatEventListeners() {
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  messageInput.addEventListener('input', handleTyping);
}

// Send message
async function sendMessage() {
  const now = Date.now();
  const text = messageInput.value.trim();

  // Rate limiting
  if (now - lastMessageTime < messageCooldown) {
    alert(`Please wait ${Math.ceil((messageCooldown - (now - lastMessageTime))/1000)} seconds`);
    return;
  }

  // Spam detection
  messageCount++;
  if (messageCount >= spamThreshold) {
    setTimeout(() => messageCount--, 10000);
    if (messageCount >= spamThreshold) {
      alert("Slow down! You're sending too many messages");
      return;
    }
  }

  // Check bans and send message
  // ... (rest of sendMessage implementation)
}

// Load messages
function loadMessages() {
  messagesRef.orderByChild('timestamp').limitToLast(100).on('child_added', (snapshot) => {
    const message = snapshot.val();
    displayMessage(message, snapshot.key);
  });
}

// Display message
function displayMessage(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = messageId;
  
  // ... (message display implementation)
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// User list management
function setupUserList() {
  usersRef.on('value', (snapshot) => {
    const users = snapshot.val() || {};
    userList.innerHTML = '';
    
    Object.entries(users).forEach(([username, data]) => {
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      // ... (user list item implementation)
      userList.appendChild(userEl);
    });
  });
}

// Typing indicators
function handleTyping() {
  updateTypingIndicator(true);
  debounceTypingIndicator();
}

function updateTypingIndicator(isTyping) {
  if (currentUser) {
    typingRef.child(currentUser).set(isTyping);
  }
}

let typingTimeout;
function debounceTypingIndicator() {
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    updateTypingIndicator(false);
  }, 2000);
}

function setupTypingListener() {
  typingRef.on('value', (snapshot) => {
    const typingUsers = snapshot.val() || {};
    const usersTyping = Object.keys(typingUsers)
      .filter(username => typingUsers[username] && username !== currentUser);
    
    typingIndicator.textContent = usersTyping.length > 0 
      ? `${usersTyping.join(', ')} ${usersTyping.length > 1 ? 'are' : 'is'} typing...` 
      : '';
  });
}

// Utility functions
function escapeHtml(text) {
  // ... (implementation)
}

function filterBannedWords(text) {
  // ... (implementation)
}