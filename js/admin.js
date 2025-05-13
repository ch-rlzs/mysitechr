import { db } from './firebase-config.js';
import { isAdmin } from './auth.js';

// DOM elements
const adminPanel = document.getElementById('adminPanel');
const adminSidebar = document.getElementById('adminSidebar');
const banInput = document.getElementById('banInput');
const banDuration = document.getElementById('banDuration');
const banUserBtn = document.getElementById('banUserBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const adminChatBtn = document.getElementById('adminChatBtn');
const publicChatBtn = document.getElementById('publicChatBtn');
const modLogs = document.getElementById('modLogs');

// Initialize admin features
export function initAdmin() {
  if (!isAdmin) return;
  
  adminPanel.style.display = 'block';
  adminSidebar.style.display = 'block';
  
  setupAdminEventListeners();
}

function setupAdminEventListeners() {
  banUserBtn.addEventListener('click', banUser);
  deleteAllBtn.addEventListener('click', deleteAllMessages);
  adminChatBtn.addEventListener('click', switchToAdminChat);
  publicChatBtn.addEventListener('click', switchToPublicChat);
}

function banUser() {
  if (!isAdmin) return;
  
  const username = banInput.value.trim();
  const hours = parseInt(banDuration.value) || 0;
  
  if (!username) {
    alert("Please enter a username");
    return;
  }

  // Ban implementation
  banInput.value = '';
}

function deleteAllMessages() {
  if (!isAdmin) return;
  
  if (confirm("Are you sure you want to delete ALL messages?")) {
    // Delete all messages implementation
  }
}

function switchToAdminChat() {
  // Switch to admin chat implementation
}

function switchToPublicChat() {
  // Switch to public chat implementation
}
