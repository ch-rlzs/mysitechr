import { db } from './firebase-config.js';
import { currentUser, isAdmin, userIP } from './state.js';

// Auth Constants
const ADMIN_USERNAME = 'chrlzs';
const ADMIN_PASSWORD = 'P4ssedHumidPerpendicular27';

// Auth State
let currentUser = null;
let isAdmin = false;
let userIP = 'unknown';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const chatSection = document.getElementById('chatSection');
const usernameInput = document.getElementById('usernameInput');
const adminLogin = document.getElementById('adminLogin');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Database References
const usersRef = db.ref('users');
const bannedUsersRef = db.ref('bannedUsers');
const ipBansRef = db.ref('ipBans');

// Initialize auth
export function initAuth() {
  setupAuthEventListeners();
  loadUserFromStorage();
}

// Setup event listeners
function setupAuthEventListeners() {
  loginBtn.addEventListener('click', login);
  logoutBtn.addEventListener('click', logout);
  usernameInput.addEventListener('input', handleUsernameInput);
}

function handleUsernameInput(e) {
  if (e.target.value === ADMIN_USERNAME) {
    adminLogin.style.display = 'block';
  } else {
    adminLogin.style.display = 'none';
  }
}

// Login function
async function login() {
  const username = usernameInput.value.trim();
  const password = adminPassword.value;

  if (!username) {
    alert("Please enter a username");
    return;
  }

  if (username === ADMIN_USERNAME && password !== ADMIN_PASSWORD) {
    alert("Invalid admin password");
    return;
  }

  currentUser = username;
  isAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  
  try {
    userIP = await detectIP();
    await checkIPBan(userIP);
    startSession();
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed");
  }
}

// Detect IP
async function detectIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

// Check IP ban
async function checkIPBan(ip) {
  const snapshot = await ipBansRef.once('value');
  const bans = snapshot.val() || {};
  if (bans[ip] && bans[ip] > Date.now()) {
    throw new Error(`Your IP is banned until ${new Date(bans[ip]).toLocaleString()}`);
  }
}

// Start session
function startSession() {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';

  // Add user to active users
  usersRef.child(currentUser).set({
    online: true,
    lastActive: Date.now(),
    isAdmin: isAdmin,
    ip: userIP
  });

  // Remove user when they disconnect
  usersRef.child(currentUser).onDisconnect().remove();
}

// Logout function
function logout() {
  if (currentUser) {
    usersRef.child(currentUser).remove();
  }
  
  loginSection.style.display = 'block';
  chatSection.style.display = 'none';
  usernameInput.value = '';
  adminPassword.value = '';
  currentUser = null;
  isAdmin = false;
}

// Utility functions
function loadUserFromStorage() {
  // Implement localStorage logic
}

export { currentUser, isAdmin, userIP };
