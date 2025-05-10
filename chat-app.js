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

let username = localStorage.getItem('chrlzsUsername') || '';
let uid = localStorage.getItem('chrlzsUid') || '';
let isAdmin = false;

const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const adminPanel = document.getElementById('adminPanel');
const usernameInput = document.getElementById('usernameInput');
const currentUserDisplay = document.getElementById('currentUserDisplay');

firebase.auth().signInAnonymously().catch(error => {
  console.error("Firebase auth error:", error);
});

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

let lastTimestamp = Date.now();
let loadingMessages = false;

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

chatMessages.addEventListener('scroll', () => {
  if (chatMessages.scrollTop === 0 && !loadingMessages) {
    ingestOlderMessages();
  }
});

if (username) {
  usernameSection.style.display = 'none';
  usernameInput.disabled = true;
  currentUserDisplay.textContent = `Logged in as: ${username}`;
  if (username === 'chrlzs2') {
    db.ref('adminPassword').once('value').then(snapshot => {
      const storedPassword = snapshot.val();
      const cachedAdmin = localStorage.getItem('isChrlzsAdmin');
      if (cachedAdmin === 'true') {
        isAdmin = true;
        adminPanel.style.display = 'block';
      } else {
        const password = prompt("Re-enter admin password:");
        if (password === storedPassword) {
          isAdmin = true;
          localStorage.setItem('isChrlzsAdmin', 'true');
          adminPanel.style.display = 'block';
        } else {
          alert("Incorrect admin password. You will be logged in as a normal user.");
        }
      }
    });
  }
}

function setUsername() {
  const inputVal = usernameInput.value.trim();
  if (!inputVal) return;

  if (inputVal === 'chrlzs2') {
    const password = prompt("Enter admin password:");
    db.ref('adminPassword').once('value').then(snapshot => {
      const storedPassword = snapshot.val();
      if (password === storedPassword) {
        isAdmin = true;
        adminPanel.style.display = 'block';
        localStorage.setItem('isChrlzsAdmin', 'true');
        finalizeUsername(inputVal);
      } else {
        alert("Incorrect admin password.");
      }
    });
  } else {
    finalizeUsername(inputVal);
  }
}

function finalizeUsername(name) {
  username = name;
  localStorage.setItem('chrlzsUsername', username);
  usernameSection.style.display = 'none';
  usernameInput.disabled = true;
  currentUserDisplay.textContent = `Logged in as: ${username}`;
}

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

function filterExplicit(text) {
  const badWords = ['fuck','shit','bitch','asshole','cunt'];
  return text.replace(new RegExp(badWords.join('|'), 'gi'), w => w[0] + '*'.repeat(w.length-1));
}

function appendMessage(msg, scroll = true) {
  if (!msg) return;
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

function deleteMessage(messageId) {
  if (!isAdmin) return;
  db.ref('messages/' + messageId).remove();
}

function banUser() {
  if (!isAdmin) return;
  
  const userToBan = document.getElementById('userToBanInput').value.trim();
  if (!userToBan) {
    alert("Please enter a username to ban");
    return;
  }

  if (confirm(`Are you sure you want to ban ${userToBan}?`)) {
    db.ref('bannedUsers/' + userToBan).set(true);
    document.getElementById('userToBanInput').value = '';
    alert(`${userToBan} has been banned`);
  }
}

function showBannedUsers() {
  if (!isAdmin) return;
  db.ref('bannedUsers').once('value').then(snapshot => {
    const banned = snapshot.val() || {};
    alert('Banned Users: ' + Object.keys(banned).join(', '));
  });
}

function deleteAllMessages() {
  if (isAdmin && confirm('Are you sure you want to delete all messages?')) {
    db.ref('messages').remove();
  }
}

function signOut() {
  localStorage.removeItem('chrlzsUsername');
  localStorage.removeItem('isChrlzsAdmin');
  location.reload();
}