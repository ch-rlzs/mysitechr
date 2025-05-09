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

let username = localStorage.getItem('chrlzsUsername');
let uid = localStorage.getItem('chrlzsUid') || crypto.randomUUID();
localStorage.setItem('chrlzsUid', uid);

const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const adminPanel = document.getElementById('adminPanel');
const userList = document.getElementById('userList');

// Set username if stored
if (username) {
  document.getElementById('usernameInput').value = username;
  usernameSection.style.display = 'none';
  updatePresence();
}

function setUsername() {
  const input = document.getElementById('usernameInput').value.trim();
  if (input) {
    username = input;
    localStorage.setItem('chrlzsUsername', username);
    usernameSection.style.display = 'none';
    updatePresence();
  }
}

function signOut() {
  if (confirm("Sign out and choose a new username?")) {
    localStorage.removeItem('chrlzsUsername');
    localStorage.removeItem('chrlzsUid');
    location.reload();
  }
}

function filterExplicit(text) {
  const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'cunt'];
  const pattern = new RegExp(badWords.join('|'), 'gi');
  return text.replace(pattern, match => match[0] + '*'.repeat(match.length - 1));
}

function sendMessage() {
  if (!username || banned) return;
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;
  const message = {
    user: username,
    uid,
    text: filterExplicit(text),
    timestamp: Date.now()
  };
  db.ref('messages').push(message);
  input.value = '';
}

function deleteMessage(id) {
  db.ref('messages/' + id).remove();
}

function updatePresence() {
  db.ref('users/' + uid).set({ username, uid });
}

function banUser(targetUid) {
  if (confirm("Ban this user?")) {
    db.ref('bannedUsers/' + targetUid).set(true);
  }
}

let banned = false;
db.ref('bannedUsers/' + uid).on('value', snapshot => {
  if (snapshot.exists()) {
    banned = true;
    alert("You have been banned from the chat.");
    location.reload();
  }
});

db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  const id = snapshot.key;
  const time = new Date(msg.timestamp).toLocaleTimeString();
  const isAdmin = username === 'chrlzs2';
  const isOwner = msg.uid === uid;

  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <span class="username">${msg.user}:</span> ${msg.text}
    <span style="color: #00ffcc66; font-size: 0.8em;"> [${time}]</span>
    ${(isAdmin || isOwner) ? `<button class="delete-btn" onclick="deleteMessage('${id}')">delete</button>` : ''}
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

db.ref('messages').on('child_removed', snapshot => {
  const id = snapshot.key;
  const element = [...chatMessages.children].find(el => el.innerHTML.includes(`deleteMessage('${id}')`));
  if (element) element.remove();
});

db.ref('users').on('value', snapshot => {
  const users = snapshot.val() || {};
  userList.innerHTML = '';
  if (username === 'chrlzs2') {
    adminPanel.style.display = 'block';
    for (const u in users) {
      const user = users[u];
      const div = document.createElement('div');
      div.classList.add('admin-user');
      div.innerHTML = `
        <span>${user.username} (${user.uid})</span>
        <button class="ban-btn" onclick="banUser('${user.uid}')">Ban</button>
      `;
      userList.appendChild(div);
  // Add these to your existing code

let typingTimeout;  // To detect when a user stops typing

// Listen for typing events
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.createElement('div');
typingIndicator.style.color = '#00ffcc';
typingIndicator.style.fontSize = '0.9em';
typingIndicator.innerHTML = "<i>User is typing...</i>";

function startTyping() {
  db.ref('typing/' + uid).set(true); // Indicate the user is typing
  if (typingTimeout) clearTimeout(typingTimeout); // Clear existing timeout
  typingTimeout = setTimeout(stopTyping, 2000);  // Stop typing after 2 seconds of inactivity
}

function stopTyping() {
  db.ref('typing/' + uid).set(false); // Indicate the user stopped typing
}

messageInput.addEventListener('input', startTyping);

// Listen for other users typing
db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  let typingUsersList = Object.keys(typingUsers).filter(uid => typingUsers[uid]);

  if (typingUsersList.length > 0 && !typingUsersList.includes(uid)) {
    typingIndicator.innerHTML = `<i>${typingUsersList.join(', ')} are typing...</i>`;
    if (!document.getElementById('typingIndicator')) {
      chatMessages.appendChild(typingIndicator);
    }
  } else {
    if (document.getElementById('typingIndicator')) {
      typingIndicator.remove();
    }
  }
});
s
    }
  }
});
