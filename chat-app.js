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

// Initialize Firebase and Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Retrieve or initialize state variables
let username = localStorage.getItem('chrlzsUsername') || '';
let uid = localStorage.getItem('chrlzsUid') || '';
let isAdmin = false;

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const adminPanel = document.getElementById('adminPanel');

// Authenticate anonymously with Firebase
firebase.auth().signInAnonymously()
  .then(() => {
    const currentUser = firebase.auth().currentUser;
    uid = currentUser.uid;
    localStorage.setItem('chrlzsUid', uid);

    // Check admin status from Realtime Database
    db.ref('admins/' + uid).once('value').then(snapshot => {
      if (snapshot.exists()) {
        isAdmin = true;
        adminPanel.style.display = 'block';
      }
    });

    // Hide username input if previously set
    if (username) {
      usernameSection.style.display = 'none';
    }
  })
  .catch(error => {
    console.error("Firebase auth error:", error);
  });

// Typing indicator logic
let typingTimeout;
function startTyping() {
  db.ref('typing/' + uid).set(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 2000);
}
function stopTyping() {
  db.ref('typing/' + uid).set(false);
}
messageInput.addEventListener('input', startTyping);

db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  const active = Object.keys(typingUsers).filter(u => typingUsers[u] && u !== uid);
  typingIndicator.textContent = active.length ? `${active.join(', ')} are typing...` : '';
});

// Load messages and handle scrolling
let lastTimestamp = Date.now();
let loadingMessages = false;

ingestOlderMessages();
chatMessages.addEventListener('scroll', () => {
  if (chatMessages.scrollTop === 0 && !loadingMessages) {
    ingestOlderMessages();
  }
});

function ingestOlderMessages() {
  loadingMessages = true;
  db.ref('messages')
    .orderByChild('timestamp')
    .endAt(lastTimestamp - 1)
    .limitToLast(10)
    .once('value', snapshot => {
      const msgs = snapshot.val() || {};
      const keys = Object.keys(msgs).reverse();
      keys.forEach(key => appendMessage(msgs[key], false));
      if (keys.length) {
        lastTimestamp = msgs[keys[keys.length - 1]].timestamp;
      }
      loadingMessages = false;
    });
}

// Set username
function setUsername() {
  const inputVal = document.getElementById('usernameInput').value.trim();
  if (!inputVal) return;
  username = inputVal;
  localStorage.setItem('chrlzsUsername', username);
  usernameSection.style.display = 'none';
}

// Send message with ban check
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !username) return;

  db.ref('bannedUsers').once('value').then(snapshot => {
    const banned = snapshot.val() || {};
    if (banned[username]) {
      alert("You are banned from sending messages.");
      return;
    }

    const msg = {
      user: username,
      uid: uid,
      text: filterExplicit(text),
      timestamp: Date.now()
    };
    db.ref('messages').push(msg);
    messageInput.value = '';
  });
}

// Profanity filter
function filterExplicit(text) {
  const badWords = ['fuck','shit','bitch','asshole','cunt'];
  return text.replace(new RegExp(badWords.join('|'), 'gi'), w => w[0] + '*'.repeat(w.length-1));
}

// Append message to chat window
function appendMessage(msg, scroll = true) {
  if (!msg || (!isAdmin && msg.user in (bannedUsers()))) return;
  const time = new Date(msg.timestamp).toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `
    <span class="username">${msg.user}:</span> ${msg.text}
    <span style="color:#00ffcc66;font-size:0.8em;"> [${time}]</span>
    ${isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${msg.key}')">×</button>` : ''}
  `;
  chatMessages.appendChild(div);
  if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Listen for new messages
let bannedCache = null;
function bannedUsers() {
  if (!bannedCache) bannedCache = {};
  db.ref('bannedUsers').once('value', snap => bannedCache = snap.val() || {});
  return bannedCache;
}

db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  msg.key = snapshot.key;
  appendMessage(msg, true);
});

// Admin: delete single message
function deleteMessage(messageId) {
  if (!isAdmin) return;
  db.ref('messages/' + messageId).remove();
}

// Admin: ban user
function banUser(userToBan) {
  if (!isAdmin) return;
  db.ref('bannedUsers/' + userToBan).set(true);
}

// Admin: show banned users
function showBannedUsers() {
  if (!isAdmin) return;
  db.ref('bannedUsers').once('value').then(snapshot => {
    const banned = snapshot.val() || {};
    alert('Banned Users: ' + Object.keys(banned).join(', '));
  });
}

// Admin: delete all messages
function deleteAllMessages() {
  if (isAdmin && confirm('Are you sure you want to delete all messages?')) {
    db.ref('messages').remove();
  }
}

// Sign out user
function signOut() {
  localStorage.removeItem('chrlzsUsername');
  location.reload();
}
