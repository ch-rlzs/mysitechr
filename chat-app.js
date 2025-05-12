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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = '';
let uid = '';
let isAdmin = false;
let lastMessageTime = 0;

const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const adminPanel = document.getElementById('adminPanel');
const currentUserDisplay = document.getElementById('currentUserDisplay');

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    uid = user.uid;
    username = user.email || "Anonymous";
    currentUserDisplay.textContent = `Logged in as: ${username}`;
    usernameSection.style.display = 'none';

    if (user.email === 'admin@chrlzs.com') {
      isAdmin = true;
      adminPanel.style.display = 'block';
    }
  } else {
    // Show login form if needed
  }
});

function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(error => alert("Login failed: " + error.message));
}

// Escape function to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tag]));
}

const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const sendTyping = debounce(() => {
  db.ref('typing/' + uid).set(false)
    .catch(error => console.error("Error updating typing status:", error));
}, 2000);

messageInput.addEventListener('input', () => {
  db.ref('typing/' + uid).set(true)
    .catch(error => console.error("Error setting typing status:", error));
  sendTyping();
});

db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  const active = Object.keys(typingUsers).filter(u => typingUsers[u] && u !== uid);
  typingIndicator.textContent = active.length ? `${active.join(', ')} are typing...` : '';
});

function sendMessage() {
  const text = messageInput.value.trim();
  const now = Date.now();
  if (!text || !username || now - lastMessageTime < 1000) return;

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
      .catch(error => console.error("Error sending message:", error));
    messageInput.value = '';
    lastMessageTime = now;
  }).catch(error => console.error("Error checking banned users:", error));
}

function createMessageElement(msg) {
  if (!msg) return null;
  const time = new Date(msg.timestamp).toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.key = msg.key;
  
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'username';
  usernameSpan.textContent = escapeHTML(msg.user) + ':';
  
  const textSpan = document.createElement('span');
  textSpan.textContent = ' ' + escapeHTML(msg.text);
  
  const timeSpan = document.createElement('span');
  timeSpan.style.color = '#00ffcc66';
  timeSpan.style.fontSize = '0.8em';
  timeSpan.textContent = ` [${time}]`;
  
  div.appendChild(usernameSpan);
  div.appendChild(textSpan);
  div.appendChild(timeSpan);
  
  if (isAdmin) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => deleteMessage(msg.key);
    div.appendChild(deleteBtn);
  }
  
  const pinBtn = document.createElement('button');
  pinBtn.className = 'pin-btn';
  pinBtn.textContent = '📌';
  pinBtn.onclick = () => pinMessage(msg.key);
  div.appendChild(pinBtn);
  
  return div;
}

db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  msg.key = snapshot.key;
  const messageElement = createMessageElement(msg);
  if (messageElement) {
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

db.ref('pinned').on('value', snapshot => {
  try {
    const pinned = snapshot.val() || {};
    document.querySelectorAll('.message').forEach(msg => {
      if (msg.dataset.key && pinned[msg.dataset.key]) {
        msg.style.backgroundColor = '#003333';
      } else {
        msg.style.backgroundColor = '';
      }
    });
  } catch (error) {
    console.error("Error processing pinned messages:", error);
  }
});

function signOut() {
  firebase.auth().signOut()
    .then(() => location.reload())
    .catch(error => console.error("Error signing out:", error));
}
