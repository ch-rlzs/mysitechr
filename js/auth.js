import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db } from './firebase-config.js';
import { ref, set, onValue, off, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// State variables
let currentUser = null;
let isAdmin = false;
let usersRef = null;
let usersListener = null;
let authListener = null;

// Initialize auth with presence tracking
export function initAuth() {
  const auth = getAuth();
  
  // Set up auth state listener
  authListener = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User signed in
      currentUser = user.displayName || user.email.split('@')[0];
      isAdmin = user.email === 'admin@chrlzs.com';
      
      // Update UI
      updateCurrentUserDisplay();
      
      // Set up presence system
      await setupPresence(user.uid);
      
      // Load online users
      loadOnlineUsers();
    } else {
      // User signed out
      if (currentUser) {
        await updateUserPresence(false);
      }
      currentUser = null;
      isAdmin = false;
      updateCurrentUserDisplay();
    }
  });
}

// Clean up all listeners
export function cleanupAuth() {
  if (usersListener) {
    off(usersListener);
    usersListener = null;
  }
  if (authListener) {
    authListener(); // Unsubscribe from auth changes
    authListener = null;
  }
}

// Presence system
async function setupPresence(uid) {
  const userStatusRef = ref(db, `users/${uid}`);
  const statusRef = ref(db, '.info/connected');
  
  // Set initial status
  await set(userStatusRef, {
    online: true,
    lastChanged: serverTimestamp(),
    isAdmin: isAdmin
  });
  
  // Setup disconnect action
  onDisconnect(userStatusRef).update({
    online: false,
    lastChanged: serverTimestamp()
  });
  
  // Monitor connection state
  onValue(statusRef, (snapshot) => {
    if (snapshot.val() === false) return;
    set(userStatusRef, {
      online: true,
      lastChanged: serverTimestamp(),
      isAdmin: isAdmin
    });
  });
}

// Update user presence
async function updateUserPresence(online) {
  if (!currentUser) return;
  const userStatusRef = ref(db, `users/${currentUser}`);
  await set(userStatusRef, {
    online: online,
    lastChanged: serverTimestamp(),
    isAdmin: isAdmin
  });
}

// Load online users
function loadOnlineUsers() {
  usersRef = ref(db, 'users');
  usersListener = onValue(usersRef, (snapshot) => {
    const users = snapshot.val() || {};
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    Object.entries(users).forEach(([uid, data]) => {
      if (data.online) {
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.innerHTML = `
          <span class="user-avatar">${uid.charAt(0).toUpperCase()}</span>
          ${uid}
          ${data.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
        `;
        userList.appendChild(userEl);
      }
    });
  });
}

// Update current user display
function updateCurrentUserDisplay() {
  const currentUserDisplay = document.getElementById('currentUserDisplay');
  if (currentUser) {
    currentUserDisplay.innerHTML = `
      <span style="font-size: 0.8em">
        Signed in as: <strong>${currentUser}</strong>
        ${isAdmin ? '<span style="color:var(--danger)"> (Admin)</span>' : ''}
      </span>
    `;
  } else {
    currentUserDisplay.textContent = '';
  }
}

// Login function
export async function login(email, password) {
  const auth = getAuth();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Logout function
export async function logout() {
  const auth = getAuth();
  try {
    await updateUserPresence(false);
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Export the isAdmin status checker
export function checkAdminStatus() {
  return isAdmin;
}

// Export current user info
export function getCurrentUser() {
  return currentUser;
}

// Export all necessary functions and variables
export {
  isAdmin,
  currentUser
};
