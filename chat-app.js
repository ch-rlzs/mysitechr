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

const ADMIN_USERNAME = 'chrlzs';
let currentUser = null;
let isAdmin = false;
let lastMessageTime = 0;
let messageCount = 0;
const messageCooldown = 1000; // 1 second
const spamThreshold = 5; // 5 messages in 10 seconds
const bannedWords = ['badword1', 'badword2']; // Add your banned words

// New Refs
const usersRef = db.ref('users');
const adminChatRef = db.ref('adminChat');
const modLogsRef = db.ref('moderationLogs');
const ipBansRef = db.ref('ipBans');
const reportedMessagesRef = db.ref('reportedMessages');

// Initialize with new features
function init() {
  loadUserFromStorage();
  setupEventListeners();
  detectIP().then(ip => {
    checkIPBan(ip);
  });
  
  if (currentUser) {
    startChatSession();
  }
}

// IP Detection (simplified)
function detectIP() {
  return fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => data.ip)
    .catch(() => 'unknown');
}

function checkIPBan(ip) {
  ipBansRef.once('value').then(snapshot => {
    const bans = snapshot.val() || {};
    if (bans[ip] && bans[ip] > Date.now()) {
      alert(`Your IP is banned until ${new Date(bans[ip]).toLocaleString()}`);
      logout();
    }
  });
}

// Enhanced Login
function login() {
  const username = usernameInput.value.trim();
  const password = document.getElementById('adminPassword')?.value;
  
  if (!username) {
    alert("Please enter a username");
    return;
  }
  
  // Admin authentication
  if (username === ADMIN_USERNAME) {
    if (!password) {
      document.getElementById('adminLogin').style.display = 'block';
      return;
    }
    
    // In production, use Firebase Auth instead
    if (password !== "P4ssedHumidPerpendicular27") {
      alert("Invalid admin password");
      return;
    }
    isAdmin = true;
  }
  
  currentUser = username;
  saveUserToStorage();
  startChatSession();
  
  // Add user to active users
  usersRef.child(username).set({
    online: true,
    lastActive: Date.now(),
    isAdmin: isAdmin
  });
  
  // Remove user when they disconnect
  usersRef.child(username).onDisconnect().remove();
}

// Enhanced sendMessage with all new features
function sendMessage() {
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
    setTimeout(() => messageCount--, 10000); // Reset counter after 10 seconds
    if (messageCount >= spamThreshold) {
      alert("Slow down! You're sending too many messages");
      return;
    }
  }
  
  // Word filter
  const filteredText = filterBannedWords(text);
  if (filteredText !== text) {
    alert("Your message contained blocked words and was modified");
  }
  
  // Check bans
  db.ref('bannedUsers/' + currentUser).once('value').then(snap => {
    const banExpiry = snap.val();
    if (banExpiry && banExpiry > Date.now()) {
      alert(`You're banned until ${new Date(banExpiry).toLocaleString()}`);
      return;
    }
    
    const message = {
      user: currentUser,
      text: escapeHtml(filteredText),
      timestamp: now,
      ip: 'recorded' // In production, store the actual IP
    };
    
    const ref = isAdmin && window.location.hash === '#admin' ? 
      adminChatRef : db.ref('messages');
    
    ref.push(message);
    lastMessageTime = now;
    messageInput.value = '';
  });
}

function filterBannedWords(text) {
  return bannedWords.reduce((str, word) => 
    str.replace(new RegExp(word, 'gi'), '*'.repeat(word.length)), text);
}

// User list management
function setupUserList() {
  usersRef.on('value', snapshot => {
    const users = snapshot.val() || {};
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    Object.entries(users).forEach(([username, data]) => {
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      userEl.innerHTML = `
        <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
        ${username}
        ${data.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
        ${!data.isAdmin && isAdmin ? 
          `<button class="report-btn" onclick="reportUser('${username}')">Report</button>` : ''}
      `;
      userList.appendChild(userEl);
    });
  });
}

// Admin features
function banUser() {
  if (!isAdmin) return;
  
  const username = banInput.value.trim();
  const hours = parseInt(document.getElementById('banDuration').value) || 0;
  const banUntil = hours > 0 ? Date.now() + (hours * 3600 * 1000) : Number.MAX_SAFE_INTEGER;
  
  if (username) {
    db.ref('bannedUsers/' + username).set(banUntil);
    
    // Log moderation action
    modLogsRef.push({
      action: 'ban',
      moderator: currentUser,
      target: username,
      duration: hours,
      timestamp: Date.now()
    });
    
    alert(`${username} banned ${hours > 0 ? `for ${hours} hours` : 'permanently'}`);
    banInput.value = '';
  }
}

function reportUser(username) {
  if (!username || username === currentUser) return;
  
  reportedMessagesRef.push({
    reporter: currentUser,
    reportedUser: username,
    reason: prompt("Reason for reporting?"),
    timestamp: Date.now()
  });
  
  alert(`${username} has been reported`);
}

// Admin chat toggle
function switchToAdminChat() {
  window.location.hash = 'admin';
  loadMessages();
  alert("Switched to admin chat");
}

function switchToPublicChat() {
  window.location.hash = '';
  loadMessages();
}

// Enhanced message loading
function loadMessages() {
  // Clear existing listeners
  db.ref('messages').off();
  adminChatRef.off();
  
  const ref = window.location.hash === '#admin' ? adminChatRef : db.ref('messages');
  
  ref.on('child_added', snapshot => {
    const message = snapshot.val();
    message.id = snapshot.key;
    displayMessage(message);
  });
}

// Enhanced message display with report button
function displayMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = message.id;
  
  const timeString = new Date(message.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="user-avatar">${message.user.charAt(0).toUpperCase()}</span>
      <span class="username">${escapeHtml(message.user)}</span>
      <span class="timestamp">[${timeString}]</span>
      ${message.user !== currentUser ? 
        `<button class="report-btn" onclick="reportMessage('${message.id}')">Report</button>` : ''}
    </div>
    <div class="message-text">${message.text}</div>
    ${isAdmin ? `
      <div class="message-actions">
        <button onclick="deleteMessage('${message.id}')" class="btn-danger">Delete</button>
        <button onclick="banUserFromMessage('${escapeHtml(message.user)}')" class="btn-danger">Ban</button>
      </div>
    ` : ''}
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize all features
function startChatSession() {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
  
  if (isAdmin) {
    adminPanel.style.display = 'block';
    document.getElementById('adminSidebar').style.display = 'block';
    loadModLogs();
  }
  
  setupUserList();
  loadMessages();
  setupTypingListener();
  messageInput.focus();
}

// Load moderation logs
function loadModLogs() {
  modLogsRef.limitToLast(10).on('value', snapshot => {
    const logs = snapshot.val() || {};
    const modLogsEl = document.getElementById('modLogs');
    modLogsEl.innerHTML = '';
    
    Object.entries(logs).forEach(([id, log]) => {
      const logEl = document.createElement('div');
      logEl.textContent = `${new Date(log.timestamp).toLocaleString()} - 
                           ${log.moderator} ${log.action}ed ${log.target} 
                           ${log.duration ? `for ${log.duration}h` : ''}`;
      modLogsEl.appendChild(logEl);
    });
  });
}
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
