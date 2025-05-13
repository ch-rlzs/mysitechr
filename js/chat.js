import { db } from './firebase-config.js';
import { currentUser, isAdmin } from './auth.js';
import { ref, onChildAdded, push, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');

// Debugging function
async function checkDatabaseConnection() {
  try {
    const testRef = ref(db, 'connection_test');
    await set(testRef, { test: new Date().toISOString() });
    const snapshot = await get(testRef);
    console.log("Database connection test:", snapshot.val());
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export async function initChat() {
  console.log("Initializing chat...");
  
  // Verify connection first
  const connected = await checkDatabaseConnection();
  if (!connected) {
    alert("Couldn't connect to database");
    return;
  }

  loadMessages();
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function loadMessages() {
  console.log("Attempting to load messages...");
  const messagesRef = ref(db, 'messages');

  onChildAdded(messagesRef, (snapshot) => {
    console.log("New message detected:", snapshot.key, snapshot.val());
    if (!snapshot.exists()) {
      console.warn("Empty message detected");
      return;
    }
    
    const message = snapshot.val();
    displayMessage(message, snapshot.key);
  }, (error) => {
    console.error("Message loading failed:", error);
    alert("Error loading messages");
  });
}

function displayMessage(message, messageId) {
  console.log("Displaying message:", messageId);
  
  // Handle missing timestamp
  const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
  const timeString = timestamp.toLocaleTimeString();

  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = messageId;
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="username">${escapeHtml(message.user || 'unknown')}</span>
      <span class="timestamp">[${timeString}]</span>
    </div>
    <div class="message-text">${escapeHtml(message.text || '')}</div>
  `;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    console.log("Sending message...");
    const messagesRef = ref(db, 'messages');
    await push(messagesRef, {
      user: currentUser,
      text: text,
      timestamp: serverTimestamp()
    });
    messageInput.value = '';
  } catch (error) {
    console.error("Message send error:", error);
    alert("Failed to send message");
  }
}

// Utility function
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
