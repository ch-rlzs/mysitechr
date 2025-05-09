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

fifirebase.initializeApp(firebaseConfig);
firebase.auth().signInAnonymously().then(() => {
  const currentUser = firebase.auth().currentUser;
  uid = currentUser.uid;
  localStorage.setItem('chrlzsUid', uid);

  db.ref('admins/' + uid).once('value').then(snapshot => {
    if (snapshot.exists()) {
      isAdmin = true;
      adminPanel.style.display = 'block';
    }
  });
});rebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = localStorage.getItem('chrlzsUsername');
let uid = localStorage.getItem('chrlzsUid') || crypto.randomUUID();
localStorage.setItem('chrlzsUid', uid);

const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const adminPanel = document.getElementById('adminPanel');

let isAdmin = false;
let typingTimeout;
let lastTimestamp = Date.now();
let loadingMessages = false;

// Restore session if username was set
if (username) {
  usernameSection.style.display = 'none';
  if (username === 'chrlzs2') {
    isAdmin = true;
    adminPanel.style.display = 'block';
  }
}

// Typing logic
function startTyping() {
  db.ref('typing/' + uid).set(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 2000);
}

function stopTyping() {
  db.ref('typing/' + uid).set(false);
}

messageInput.addEventListener('input', startTyping);

db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  let typingUsersList = Object.keys(typingUsers).filter(u => typingUsers[u]);
  if (typingUsersList.length > 0 && !typingUsersList.includes(uid)) {
    typingIndicator.innerHTML = `<i>${typingUsersList.join(', ')} are typing...</i>`;
  } else {
    typingIndicator.innerHTML = '';
  }
});

// Load older messages on scroll
function loadOlderMessages() {
  if (loadingMessages) return;
  loadingMessages = true;

  db.ref('messages').orderByChild('timestamp').endAt(lastTimestamp).limitToLast(10).once('value', snapshot => {
    const messages = snapshot.val();
    if (messages) {
      const keys = Object.keys(messages).reverse();
      keys.forEach(key => {
        const msg = messages[key];
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `
          <span class="username">${msg.user}:</span> ${msg.text}
          <span style="color: #00ffcc66; font-size: 0.8em;"> [${time}]</span>
        `;
        chatMessages.insertBefore(div, chatMessages.firstChild);
      });
      lastTimestamp = messages[keys[keys.length - 1]].timestamp;
    }
    loadingMessages = false;
  });
}

chatMessages.addEventListener('scroll', () => {
  if (chatMessages.scrollTop === 0 && !loadingMessages) {
    loadOlderMessages();
  }
});

// Set username
function setUsername() {
  const input = document.getElementById('usernameInput').value.trim();
  if (!input) return;

  if (input === 'chrlzs2') {
    const password = prompt("Enter admin password:");
    if (password !== 'yourSecretPassword') {
      alert("Incorrect password.");
      return;
    }
    isAdmin = true;
    adminPanel.style.display = 'block';
  }

  username = input;
  localStorage.setItem('chrlzsUsername', username);
  usernameSection.style.display = 'none';
}

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !username) return;

  db.ref('bannedUsers').once('value', snapshot => {
    const bannedUsers = snapshot.val() || [];
    if (bannedUsers.includes(username)) {
      alert("You are banned from sending messages.");
      return;
    }

    const message = {
      user: username,
      uid: uid,
      text: filterExplicit(text),
      timestamp: Date.now()
    };
    db.ref('messages').push(message);
    messageInput.value = '';
  });
}

// Filter profanity
function filterExplicit(text) {
  const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'cunt'];
  const pattern = new RegExp(badWords.join('|'), 'gi');
  return text.replace(pattern, match => match[0] + '*'.repeat(match.length - 1));
}

// Message listener
db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  const messageId = snapshot.key;

  db.ref('bannedUsers').once('value', snapshot => {
    const bannedUsers = snapshot.val() || [];
    if (bannedUsers.includes(msg.user)) return;

    const div = document.createElement('div');
    div.classList.add('message');
    const time = new Date(msg.timestamp).toLocaleTimeString();

    div.innerHTML = `
      <span class="username">${msg.user}:</span> ${msg.text}
      <span style="color: #00ffcc66; font-size: 0.8em;"> [${time}]</span>
      ${(isAdmin) ? `<button class="delete-btn" onclick="deleteMessage('${messageId}')">delete</button>` : ''}
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
});

// Delete message
function deleteMessage(messageId) {
  db.ref('messages/' + messageId).remove();
}

// Ban user
function banUser(userToBan) {
  if (!isAdmin) return;
  db.ref('bannedUsers/' + userToBan).set(true);
}

function showBannedUsers() {
  if (!isAdmin) return;
  db.ref('bannedUsers').once('value', snapshot => {
    const banned = snapshot.val() || {};
    alert('Banned Users: ' + Object.keys(banned).join(', '));
  });
}
// Sign out
function signOut() {
  localStorage.removeItem('chrlzsUsername');
  location.reload();
}
