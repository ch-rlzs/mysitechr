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
let isAdmin = false;
let lastMessageTime = 0;
const ADMIN_USERNAME = 'chrlzs';
const ADMIN_PASSWORD = 'your_secure_password_here'; // Set your admin password

function setUsername() {
  const usernameInput = document.getElementById('usernameInput');
  username = usernameInput.value.trim();
  
  if (!username) {
    alert("Please enter a username");
    return;
  }
  
  if (username === ADMIN_USERNAME) {
    document.getElementById('adminLogin').style.display = 'block';
    return;
  }
  
  completeLogin();
}

function adminAuth() {
  const passwordInput = document.getElementById('adminPasswordInput');
  if (passwordInput.value === ADMIN_PASSWORD) {
    isAdmin = true;
    completeLogin();
  } else {
    alert("Incorrect admin password");
  }
}

function completeLogin() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('messageInput').disabled = false;
  document.getElementById('sendBtn').disabled = false;
  
  const currentUserDisplay = document.getElementById('currentUserDisplay');
  currentUserDisplay.textContent = `Logged in as: ${username}`;
  
  if (isAdmin) {
    document.getElementById('adminPanel').style.display = 'block';
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tag]));
}

function sendMessage() {
  const text = document.getElementById('messageInput').value.trim();
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
      text: escapeHTML(text),
      timestamp: now
    };
    
    db.ref('messages').push(msg);
    document.getElementById('messageInput').value = '';
    lastMessageTime = now;
  });
}

function createMessageElement(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.key = msg.key;
  
  const time = new Date(msg.timestamp).toLocaleTimeString();
  
  div.innerHTML = `
    <span class="username">${escapeHTML(msg.user)}:</span> ${escapeHTML(msg.text)}
    <span style="color:#00ffcc66;font-size:0.8em;"> [${time}]</span>
    ${isAdmin ? `
      <button class="delete-btn" onclick="deleteMessage('${msg.key}')">×</button>
      <button class="ban-btn" onclick="banUserFromMessage('${escapeHTML(msg.user)}')">Ban</button>
    ` : ''}
  `;
  
  return div;
}

db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  msg.key = snapshot.key;
  const messageElement = createMessageElement(msg);
  document.getElementById('chatMessages').appendChild(messageElement);
  document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
});

function deleteMessage(messageId) {
  if (!isAdmin) return;
  db.ref('messages/' + messageId).remove();
}

function deleteAllMessages() {
  if (!isAdmin) return;
  if (confirm("Are you sure you want to delete ALL messages?")) {
    db.ref('messages').remove();
  }
}

function banUser() {
  if (!isAdmin) return;
  const usernameToBan = document.getElementById('banUsernameInput').value.trim();
  if (usernameToBan) {
    db.ref('bannedUsers/' + usernameToBan).set(true);
    document.getElementById('banUsernameInput').value = '';
    alert(`${usernameToBan} has been banned`);
  }
}

function banUserFromMessage(username) {
  if (!isAdmin) return;
  if (username && confirm(`Ban ${username}?`)) {
    db.ref('bannedUsers/' + username).set(true);
    alert(`${username} has been banned`);
  }
}

// Typing indicator functionality
const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const sendTyping = debounce(() => {
  db.ref('typing/' + username).set(false);
}, 2000);

document.getElementById('messageInput').addEventListener('input', () => {
  db.ref('typing/' + username).set(true);
  sendTyping();
});

db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  const active = Object.keys(typingUsers).filter(u => typingUsers[u] && u !== username);
  document.getElementById('typingIndicator').textContent = 
    active.length ? `${active.join(', ')} are typing...` : '';
});