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

let username = localStorage.getItem('chrlzsUsername');
let uid = localStorage.getItem('chrlzsUid') || crypto.randomUUID();
localStorage.setItem('chrlzsUid', uid);

const chatMessages = document.getElementById('chatMessages');
const usernameSection = document.getElementById('usernameSection');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');

let typingTimeout;
let lastTimestamp = Date.now();
let loadingMessages = false;

// Typing Indicator Logic
function startTyping() {
  db.ref('typing/' + uid).set(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 2000);  // Stop typing after 2 seconds
}

function stopTyping() {
  db.ref('typing/' + uid).set(false);
}

messageInput.addEventListener('input', startTyping);

db.ref('typing').on('value', snapshot => {
  const typingUsers = snapshot.val() || {};
  let typingUsersList = Object.keys(typingUsers).filter(uid => typingUsers[uid]);

  if (typingUsersList.length > 0 && !typingUsersList.includes(uid)) {
    typingIndicator.innerHTML = `<i>${typingUsersList.join(', ')} are typing...</i>`;
  } else {
    typingIndicator.innerHTML = '';
  }
});

// Load older messages (Pagination)
function loadOlderMessages() {
  if (loadingMessages) return;
  loadingMessages = true;

  db.ref('messages').orderByChild('timestamp').endAt(lastTimestamp).limitToLast(10).once('value', snapshot => {
    const messages = snapshot.val();
    if (messages) {
      const keys = Object.keys(messages);
      keys.reverse(); // Show messages from older to newer

      keys.forEach(key => {
        const msg = messages[key];
        const div = document.createElement('div');
        div.classList.add('message');
        const time = new Date(msg.timestamp).toLocaleTimeString();
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
  if (input) {
    username = input;
    localStorage.setItem('chrlzsUsername', username);
    usernameSection.style.display = 'none';
  }
}

// Send message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !username) return;

  const message = {
    user: username,
    uid: uid,
    text: filterExplicit(text),
    timestamp: Date.now()
  };

  db.ref('messages').push(message);
  input.value = '';
}

// Filter explicit words
function filterExplicit(text) {
  const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'cunt']; // Extend as needed
  const pattern = new RegExp(badWords.join('|'), 'gi');
  return text.replace(pattern, match => match[0] + '*'.repeat(match.length - 1));
}

// Firebase message listener
db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  const messageId = snapshot.key;

  const div = document.createElement('div');
  div.classList.add('message');
  const time = new Date(msg.timestamp).toLocaleTimeString();

  div.innerHTML = `
    <span class="username">${msg.user}:</span> ${msg.text}
    <span style="color: #00ffcc66; font-size: 0.8em;"> [${time}]</span>
  `;

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
