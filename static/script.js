const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const messagesContainer = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");

let currentChatId = null;
let userId = null;
let db = null;

// Firebase init
firebase.initializeApp({
  apiKey: "AIzaSyD6qceA3bsMVb5fAE--699_omZEQxLCeAM",
  authDomain: "straitai-v03.firebaseapp.com",
  projectId: "straitai-v03",
});
db = firebase.firestore();

firebase.auth().signInAnonymously().then((cred) => {
  userId = cred.user.uid;
  loadChats();
});

// Send message
sendButton.onclick = () => {
  const query = input.value.trim();
  if (!query) return;

  appendMessage("You", query, "user-message");
  saveMessage(currentChatId, "user", query);

  input.value = "";
  showTyping(true);

  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      appendMessage("AI", data.response, "bot-message");
      saveMessage(currentChatId, "bot", data.response);
    })
    .catch(() => {
      appendMessage("AI", "Ughh... brain fart 😵‍💫", "bot-message");
    })
    .finally(() => {
      showTyping(false);
    });
};

// Show/hide typing bubble
function showTyping(show) {
  typingIndicator.style.display = show ? "inline-block" : "none";
}

// Add message to UI
function appendMessage(sender, text, cls) {
  const msg = document.createElement("div");
  msg.className = `message ${cls}`;
  msg.innerText = text;
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Save message to Firestore
function saveMessage(chatId, sender, text) {
  if (!chatId) return;
  db.collection("users").doc(userId)
    .collection("chats").doc(chatId)
    .collection("messages").add({
      sender,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Load all user chats
function loadChats() {
  db.collection("users").doc(userId).collection("chats")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      chatList.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.innerText = doc.data().name;
        li.onclick = () => loadMessages(doc.id);
        chatList.appendChild(li);
      });
    });
}

// Load messages from Firestore
function loadMessages(chatId) {
  currentChatId = chatId;
  messagesContainer.innerHTML = "";
  db.collection("users").doc(userId)
    .collection("chats").doc(chatId)
    .collection("messages")
    .orderBy("timestamp")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const { sender, text } = doc.data();
        appendMessage(sender === "user" ? "You" : "AI", text, sender === "user" ? "user-message" : "bot-message");
      });
    });
}

// Create new chat
newChatBtn.onclick = () => {
  const name = "Chat " + Date.now();
  db.collection("users").doc(userId).collection("chats").add({
    name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(docRef => {
    currentChatId = docRef.id;
    messagesContainer.innerHTML = "";
    loadChats();
  });
};