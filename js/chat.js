import { db } from './firebase-config.js';
import { currentUser, isAdmin } from './auth.js';
import { ref, onChildAdded, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// Initialize chat
export function initChat() {
  setupChatEventListeners();
  loadMessages();
}

function setupChatEventListeners() {
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function loadMessages() {
  const messagesRef = ref(db, 'messages');
  
  onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val();
    displayMessage(message, snapshot.key);
  });
}

function displayMessage(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.dataset.id = messageId;
  
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="username">${escapeHtml(message.user)}</span>
      <span class="timestamp">[${time}]</span>
    </div>
    <div class="message-text">${escapeHtml(message.text)}</div>
    ${isAdmin ? `
      <div class="message-actions">
        <button onclick="deleteMessage('${messageId}')" class="btn-danger">Delete</button>
      </div>
    ` : ''}
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser) return;

  try {
    const messagesRef = ref(db, 'messages');
    await push(messagesRef, {
      user: currentUser,
      text: text,
      timestamp: serverTimestamp()
    });
    messageInput.value = '';
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message");
  }
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

// Make deleteMessage available globally
window.deleteMessage = async function(messageId) {
  if (!isAdmin) return;
  
  try {
    const messageRef = ref(db, `messages/${messageId}`);
    await set(messageRef, null);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};
