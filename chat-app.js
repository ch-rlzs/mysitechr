// Firebase config
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

// Global variables
let username = '';
let uid = '';
let isAdmin = false;
let lastMessageTime = 0;

// DOM elements
let chatMessages, usernameSection, messageInput, typingIndicator, adminPanel, currentUserDisplay;

document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  chatMessages = document.getElementById('chatMessages');
  usernameSection = document.getElementById('usernameSection');
  messageInput = document.getElementById('messageInput');
  typingIndicator = document.getElementById('typingIndicator');
  adminPanel = document.getElementById('adminPanel');
  currentUserDisplay = document.getElementById('currentUserDisplay');

  // Initialize auth state listener
  initAuth();
});

function initAuth() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      uid = user.uid;
      username = user.email || "Anonymous";
      
      if (currentUserDisplay) {
        currentUserDisplay.textContent = `Logged in as: ${username}`;
      }
      
      if (usernameSection) {
        usernameSection.style.display = 'none';
      }

      // Check if admin
      if (user.email === 'admin@chrlzs.com') {
        isAdmin = true;
        if (adminPanel) adminPanel.style.display = 'block';
      }
    } else {
      // No user signed in
      if (usernameSection) usernameSection.style.display = 'block';
      if (currentUserDisplay) currentUserDisplay.textContent = '';
      if (adminPanel) adminPanel.style.display = 'none';
    }
  });
}

function checkAdminInput() {
  const emailInput = document.getElementById('adminEmail');
  const loginForm = document.getElementById('loginForm');
  
  if (emailInput && loginForm) {
    if (emailInput.value.toLowerCase().includes('admin')) {
      loginForm.style.display = 'block';
    } else {
      loginForm.style.display = 'none';
    }
  }
}

function adminLogin() {
  const email = document.getElementById('adminEmail')?.value;
  const password = document.getElementById('adminPassword')?.value;
  
  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) loginForm.style.display = 'none';
    })
    .catch(error => {
      alert("Login failed: " + error.message);
    });
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tag]));
}

// Debounce typing indicator
const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const sendTyping = debounce(() => {
  if (uid) {
    db.ref('typing/' + uid).set(false)
      .catch(error => console.error("Error updating typing status:", error));
  }
}, 2000);

if (messageInput) {
  messageInput.addEventListener('input', () => {
    if (uid) {
      db.ref('typing/' + uid).set(true)
        .catch(error => console.error("Error setting typing status:", error));
      sendTyping();
    }
  });
}

// Typing indicator listener
db.ref('typing').on('value', snapshot => {
  if (typingIndicator) {
    const typingUsers = snapshot.val() || {};
    const active = Object.keys(typingUsers).filter(u => typingUsers[u] && u !== uid);
    typingIndicator.textContent = active.length ? `${active.join(', ')} are typing...` : '';
  }
});

function sendMessage() {
  if (!messageInput || !username) return;
  
  const text = messageInput.value.trim();
  const now = Date.now();
  
  if (!text || now - lastMessageTime < 1000) return;

  db.ref('bannedUsers').once('value').then(snapshot => {
    const banned = snapshot.val() || {};
    if (banned[username]) {
      alert("You are banned from sending messages.");
      return;
    }

    const msg = {
      user: username,
      uid: uid,
      text: escapeHTML(text),
      timestamp: now
    };
    
    db.ref('messages').push(msg)
      .then(() => {
        messageInput.value = '';
        lastMessageTime = now;
      })
      .catch(error => console.error("Error sending message:", error));
  }).catch(error => console.error("Error checking banned users:", error));
}

function createMessageElement(msg) {
  if (!msg || !chatMessages) return null;
  
  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.key = msg.key;
  
  const time = new Date(msg.timestamp).toLocaleTimeString();
  
  div.innerHTML = `
    <span class="username">${escapeHTML(msg.user)}:</span> ${escapeHTML(msg.text)}
    <span style="color:#00ffcc66;font-size:0.8em;"> [${time}]</span>
    ${isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${msg.key}')">×</button>` : ''}
    <button class="pin-btn" onclick="pinMessage('${msg.key}')">📌</button>
  `;
  
  return div;
}

// Message listener
db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  msg.key = snapshot.key;
  
  const messageElement = createMessageElement(msg);
  if (messageElement && chatMessages) {
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

function deleteMessage(messageId) {
  if (!isAdmin) return;
  db.ref('messages/' + messageId).remove()
    .catch(error => console.error("Error deleting message:", error));
}

function pinMessage(messageId) {
  db.ref('pinned/' + messageId).set(true)
    .catch(error => console.error("Error pinning message:", error));
}

// Pinned messages listener
db.ref('pinned').on('value', snapshot => {
  const pinned = snapshot.val() || {};
  const messages = document.querySelectorAll('.message');
  
  messages.forEach(msg => {
    if (msg?.dataset?.key) {
      msg.style.backgroundColor = pinned[msg.dataset.key] ? '#003333' : '';
    }
  });
});

function signOut() {
  firebase.auth().signOut()
    .then(() => {
      window.location.reload();
    })
    .catch(error => {
      console.error("Error signing out:", error);
    });
}