// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBC1UiQ5HG2u6I1IyQP77iDk7CCaiH0SVo",
  authDomain: "chrlzs-chat-bot.firebaseapp.com",
  projectId: "chrlzs-chat-bot",
  storageBucket: "chrlzs-chat-bot.appspot.com",
  messagingSenderId: "294945926345",
  appId: "1:294945926345:web:a4e6a9ac8dd81dec8fb118",
  measurementId: "G-T9SSN0LLK6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const signInBtn = document.getElementById('sign-in');
const signOutBtn = document.getElementById('sign-out');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const chatContainer = document.getElementById('chat-container');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Sign in with Google
signInBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error("Sign in error:", error);
            alert("Sign in failed. Please try again.");
        });
});

// Sign out
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User signed in
        signInBtn.style.display = 'none';
        userInfoDiv.style.display = 'block';
        chatContainer.style.display = 'block';
        userNameSpan.textContent = user.displayName || user.email;
        loadChatHistory();
    } else {
        // User signed out
        signInBtn.style.display = 'block';
        userInfoDiv.style.display = 'none';
        chatContainer.style.display = 'none';
        messagesDiv.innerHTML = '';
    }
});

// Send message
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    // Add user message to UI
    addMessageToChat(user.displayName || 'User', messageText, 'user');
    
    // Save to Firestore
    db.collection('chatbotmessages').add({
        userId: user.uid,
        userName: user.displayName || user.email,
        message: messageText,
        timestamp: firebase
