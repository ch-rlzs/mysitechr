import { db, isAdmin } from './firebase-config.js';
import { currentUser } from './auth.js';

// DOM Elements
const adminPanel = document.getElementById('adminPanel');
const adminSidebar = document.getElementById('adminSidebar');
const banInput = document.getElementById('banInput');
const banDuration = document.getElementById('banDuration');
const banUserBtn = document.getElementById('banUserBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const adminChatBtn = document.getElementById('adminChatBtn');
const publicChatBtn = document.getElementById('publicChatBtn');
const modLogs = document.getElementById('modLogs');

// Database References
const adminChatRef = db.ref('adminChat');
const modLogsRef = db.ref('moderationLogs');
const reportedMessagesRef = db.ref('reportedMessages');
const ipBansRef = db.ref('ipBans');

// Initialize admin features
export function initAdmin() {
  if (!isAdmin) return;
  
  adminPanel.style.display = 'block';
  adminSidebar.style.display = 'block';
  
  setupAdminEventListeners();
  loadModLogs();
}

// Setup event listeners
function setupAdminEventListeners() {
  banUserBtn.addEventListener('click', banUser);
  deleteAllBtn.addEventListener('click', deleteAllMessages);
  adminChatBtn.addEventListener('click', switchToAdminChat);
  publicChatBtn.addEventListener('click', switchToPublicChat);
}

// Ban user
async function banUser() {
  const username = banInput.value.trim();
  const hours = parseInt(banDuration.value) || 0;
  
  if (!username) {
    alert("Please enter a username");
    return;
  }

  const banUntil = hours > 0 ? Date.now() + (hours * 3600 * 1000) : Number.MAX_SAFE_INTEGER;
  
  try {
    // Ban username
    await db.ref(`bannedUsers/${username}`).set(banUntil);
    
    // Try to ban IP
    const userSnapshot = await db.ref(`users/${username}`).once('value');
    const userData = userSnapshot.val();
    if (userData?.ip) {
      await ipBansRef.child(userData.ip).set(banUntil);
    }
    
    // Log action
    await modLogsRef.push({
      action: 'ban',
      moderator: currentUser,
      target: username,
      duration: hours,
      timestamp: Date.now()
    });
    
    alert(`${username} banned ${hours > 0 ? `for ${hours} hours` : 'permanently'}`);
    banInput.value = '';
  } catch (error) {
    console.error("Ban error:", error);
    alert("Failed to ban user");
  }
}

// Delete all messages
async function deleteAllMessages() {
  if (!confirm("Are you sure you want to delete ALL messages?")) return;
  
  try {
    await messagesRef.remove();
    await modLogsRef.push({
      action: 'delete_all',
      moderator: currentUser,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Delete all error:", error);
    alert("Failed to delete messages");
  }
}

// Load moderation logs
function loadModLogs() {
  modLogsRef.orderByChild('timestamp').limitToLast(20).on('value', (snapshot) => {
    const logs = snapshot.val() || {};
    modLogs.innerHTML = '';
    
    Object.entries(logs).forEach(([id, log]) => {
      const logEl = document.createElement('div');
      logEl.textContent = `${new Date(log.timestamp).toLocaleString()} - 
                          ${log.moderator} ${log.action}ed ${log.target || ''} 
                          ${log.duration ? `for ${log.duration}h` : ''}`;
      modLogs.appendChild(logEl);
    });
  });
}

// Switch chat channels
function switchToAdminChat() {
  window.location.hash = '#admin';
  // Reload messages (implementation in chat.js)
  alert("Switched to admin chat");
}

function switchToPublicChat() {
  window.location.hash = '';
  // Reload messages (implementation in chat.js)
  alert("Switched to public chat");
}