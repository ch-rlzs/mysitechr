import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db } from './firebase-config.js';

// Shared state variables
export let currentUser = null;
export let isAdmin = false;
export let userIP = 'unknown';

// DOM elements
const loginSection = document.getElementById('loginSection');
const chatSection = document.getElementById('chatSection');
const usernameInput = document.getElementById('usernameInput');
const adminLogin = document.getElementById('adminLogin');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize auth
export function initAuth() {
  setupAuthEventListeners();
}

function setupAuthEventListeners() {
  loginBtn.addEventListener('click', login);
  logoutBtn.addEventListener('click', logout);
  usernameInput.addEventListener('input', handleUsernameInput);
}

function handleUsernameInput(e) {
  adminLogin.style.display = e.target.value === 'chrlzs' ? 'block' : 'none';
}

async function login() {
  const username = usernameInput.value.trim();
  const password = adminPassword.value;

  if (!username) {
    alert("Please enter a username");
    return;
  }

  // Admin login flow
  if (username === 'chrlzs') {
    if (!password) {
      alert("Please enter admin password");
      return;
    }

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, 'admin@chrlzs.com', password);
      isAdmin = true;
    } catch (error) {
      alert(`Admin login failed: ${error.message}`);
      return;
    }
  }

  currentUser = username;
  
  try {
    userIP = await detectIP();
    startSession();
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed");
  }
}

async function detectIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

function startSession() {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
  
  // Focus message input after login
  document.getElementById('messageInput')?.focus();
}

function logout() {
  const auth = getAuth();
  auth.signOut();
  
  currentUser = null;
  isAdmin = false;
  userIP = 'unknown';
  
  loginSection.style.display = 'block';
  chatSection.style.display = 'none';
  usernameInput.value = '';
  adminPassword.value = '';
  usernameInput.focus();
}
