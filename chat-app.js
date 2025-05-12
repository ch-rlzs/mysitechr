// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgFYlZc9PI95uSEC_iejXEZOerZ8ebO44",
  authDomain: "chrlzs-chat-645cf.firebaseapp.com",
  databaseURL: "https://chrlzs-chat-645cf-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "chrlzs-chat-645cf",
  storageBucket: "chrlzs-chat-645cf.appspot.com",
  messagingSenderId: "426878855113",
  appId: "1:426878855113:web:166da584829cffd5106a18",
  measurementId: "G-5XW702X3TQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// App State
const ADMIN_USERNAME = 'chrlzs';
let currentUser = null;
let isAdmin = false;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const chatSection = document.getElementById('chatSection');
const usernameInput = document.getElementById('usernameInput');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const adminPanel = document.getElementById('adminPanel');
const banInput = document.getElementById('banInput');

// Initialize the app
function init() {
  loadUserFromStorage();
  setupEventListeners();
  
  if (currentUser) {
    startChatSession();
  }
}

// Load user from localStorage
function loadUserFromStorage() {
  const savedUser = localStorage.getItem('chatUser');
  if (savedUser) {
    currentUser = savedUser;
    isAdmin = currentUser === ADMIN_USERNAME;
  }
}

// Save user to localStorage
function saveUserToStorage() {
  if (currentUser) {
    localStorage.setItem('chatUser', currentUser);
  }
}

// Clear user from storage
function clearUserFromStorage() {
  localStorage.removeItem('chatUser');
}

// Setup event listeners
function setupEventListeners() {
  messageInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  messageInput?.addEventListener('input', () => {
    updateTypingIndicator(true);
    debounceTypingIndicator();
  });
}

// Login function
function login() {
  const username = usernameInput.value.trim();
  
  if (!username) {
    alert("Please enter a username");
    return;
  }
  
  currentUser = username;
  isAdmin = currentUser === ADMIN_USERNAME;
  saveUserToStorage();
  startChatSession();
}

// Start chat session
function startChatSession() {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
  
  if (isAdmin) {
    adminPanel.style.display = 'block';
  }
  
  messageInput.focus();
  loadMessages();
  setupTypingListener();
}

// Logout function
function logout() {
  updateTypingIndicator(false);
  clearUserFromStorage();
  currentUser = null;
  isAdmin = false;
  
  chatSection.style.display = 'none';
  loginSection.style.display = 'block';
  usernameInput.value = '';
  usernameInput.focus();
}

// Send message function
function sendMessage() {
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentUser) return;
  
  // Check if user is banned
  db.ref('bannedUsers').once('value').then(snapshot => {
    const bannedUsers = snapshot.val() || {};
    if (bannedUsers[currentUser]) {
      alert("You are banned from sending messages");
      return;
    }
    
    const message = {
      user: currentUser,
      text: escapeHtml(messageText),
      timestamp: Date.now()
    };
    
    db.ref('messages').push(message);
    messageInput.value = '';
  });
}

// Load messages from Firebase
function loadMessages() {
  db.ref('messages').on('child_added', (snapshot) => {
    const message = snapshot.val();
    message.id = snapshot.key;
    displayMessage(message);
  });
}

// Display a message in the chat
function displayMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = message.id;
  
  const timeString = new Date(message.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <span class="username">${escapeHtml(message.user)}</span>
    <span class="timestamp">[${timeString}]</span>
    <div>${message.text}</div>
    ${isAdmin ? `
      <button onclick="deleteMessage('${message.id}')" class="btn-danger">Delete</button>
      <button onclick="banUserFromMessage('${escapeHtml(message.user)}')" class="btn-danger">Ban</button>
    ` : ''}
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Delete a message
function deleteMessage(messageId) {
  if (!isAdmin) return;
  db.ref('messages/' + messageId).remove();
}

// Delete all messages
function deleteAllMessages() {
  if (!isAdmin) return;
  if (confirm("Are you sure you want to delete ALL messages?")) {
    db.ref('messages').remove();
  }
}

// Ban a user
function banUser() {
  if (!isAdmin) return;
  const username = banInput.value.trim();
  if (username) {
    db.ref('bannedUsers/' + username).set(true);
    banInput.value = '';
    alert(`${username} has been banned`);
  }
}

// Ban user from message
function banUserFromMessage(username) {
  if (!isAdmin) return;
  if (confirm(`Ban ${username}?`)) {
    db.ref('bannedUsers/' + username).set(true);
    alert(`${username} has been banned`);
  }
}

// Typing indicator functions
let typingTimeout;
function updateTypingIndicator(isTyping) {
  if (!currentUser) return;
  db.ref('typing/' + currentUser).set(isTyping);
}

function debounceTypingIndicator() {
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    updateTypingIndicator(false);
  }, 2000);
}

function setupTypingListener() {
  db.ref('typing').on('value', (snapshot) => {
    const typingUsers = snapshot.val() || {};
    const usersTyping = Object.keys(typingUsers)
      .filter(username => typingUsers[username] && username !== currentUser);
    
    if (usersTyping.length > 0) {
      typingIndicator.textContent = `${usersTyping.join(', ')} ${usersTyping.length > 1 ? 'are' : 'is'} typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Make functions available globally
window.login = login;
window.logout = logout;
window.sendMessage = sendMessage;
window.deleteMessage = deleteMessage;
window.deleteAllMessages = deleteAllMessages;
window.banUser = banUser;
window.banUserFromMessage = banUserFromMessage;

// Initialize the app when loaded
document.addEventListener('DOMContentLoaded', init);
