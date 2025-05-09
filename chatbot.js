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

// Event Listeners
signInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOut);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Authentication Functions
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error("Sign in error:", error);
            alert("Sign in failed: " + error.message);
        });
}

function signOut() {
    auth.signOut();
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User signed in
        signInBtn.style.display = 'none';
        userInfoDiv.style.display = 'block';
        chatContainer.style.display = 'block';
        userNameSpan.textContent = user.displayName || user.email;
        
        // Load chat history
        loadChatHistory();
    } else {
        // User signed out
        signInBtn.style.display = 'block';
        userInfoDiv.style.display = 'none';
        chatContainer.style.display = 'none';
        messagesDiv.innerHTML = '';
    }
});

// Chat Functions
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
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'user'
    }).catch((error) => {
        console.error("Error saving message:", error);
        alert("Couldn't send message. Please try again.");
    });
    
    // Clear input
    messageInput.value = '';
    
    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    messagesDiv.innerHTML += `<div id="${loadingId}" class="message loading">AI is thinking...</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Generate AI response (replace with actual API call)
    setTimeout(() => {
        document.getElementById(loadingId)?.remove();
        const aiResponse = generateAIResponse(messageText);
        addMessageToChat('AI Assistant', aiResponse, 'ai');
        
        // Save AI response
        db.collection('chatbotmessages').add({
            userId: 'ai',
            userName: 'AI Assistant',
            message: aiResponse,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'ai'
        });
    }, 1000);
}

function addMessageToChat(sender, message, type) {
    const messageClass = type === 'ai' ? 'ai-message' : '';
    messagesDiv.innerHTML += `
        <div class="message ${messageClass}">
            <span class="username">${sender}:</span> ${message}
        </div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function loadChatHistory() {
    messagesDiv.innerHTML = '';
    
    db.collection('chatbotmessages')
        .orderBy('timestamp')
        .limit(50)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                addMessageToChat(data.userName, data.message, data.type);
            });
        })
        .catch((error) => {
            console.error("Error loading chat history:", error);
        });
}

// Placeholder AI response (replace with actual API integration)
function generateAIResponse(userMessage) {
    // This is a placeholder - connect to your AI service here
    const responses = [
        "I understand you're asking about: " + userMessage,
        "That's an interesting question. Regarding " + userMessage + ", I'd say...",
        "Let me think about that... " + userMessage + " is quite fascinating.",
        "Based on my knowledge, " + userMessage + " is an important topic."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Test Firestore connection on load
window.addEventListener('load', () => {
    if (auth.currentUser) {
        db.collection('chatbotmessages').get()
            .then(() => console.log("Firestore connection successful"))
            .catch((error) => console.error("Firestore error:", error));
    }
});
