import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db } from './firebase-config.js';
import { ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// State variables
export let currentUser = null;
export let isAdmin = false;

// DOM elements
const currentUserDisplay = document.getElementById('currentUserDisplay');
const userList = document.getElementById('userList');

// Initialize auth
export function initAuth() {
  const auth = getAuth();
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      currentUser = user.displayName || user.email.split('@')[0];
      isAdmin = user.email === 'admin@chrlzs.com';
      
      // Update UI
      updateCurrentUserDisplay();
      await updateUserPresence(true);
      
      // Load online users
      loadOnlineUsers();
    } else {
      // User is signed out
      if (currentUser) {
        await updateUserPresence(false);
      }
      currentUser = null;
      isAdmin = false;
      updateCurrentUserDisplay();
    }
  });
}

function updateCurrentUserDisplay() {
  if (currentUser) {
    currentUserDisplay.innerHTML = `
      <span style="font-size: 0.8em">Signed in as: 
        <strong>${currentUser}</strong>
        ${isAdmin ? '<span style="color:var(--danger)"> (Admin)</span>' : ''}
      </span>
    `;
  } else {
    currentUserDisplay.textContent = '';
  }
}

async function updateUserPresence(online) {
  if (!currentUser) return;
  
  const userStatusRef = ref(db, `users/${currentUser}`);
  await set(userStatusRef, {
    online: online,
    lastChanged: Date.now(),
    isAdmin: isAdmin
  });
}

function loadOnlineUsers() {
  const usersRef = ref(db, 'users');
  
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val() || {};
    userList.innerHTML = '';
    
    Object.entries(users).forEach(([username, data]) => {
      if (data.online) {
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.style.fontSize = '0.8em'; // Smaller text
        userEl.innerHTML = `
          <span class="user-avatar">${username.charAt(0).toUpperCase()}</span>
          ${username}
          ${data.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
        `;
        userList.appendChild(userEl);
      }
    });
  });
}

// Make sure to clean up listeners when needed
export function cleanupAuth() {
  const usersRef = ref(db, 'users');
  off(usersRef);
}
