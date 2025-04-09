const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const API_URL = "/api/chat";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let uid = null;
let currentChatId = null;

// Firebase Login
firebase.auth().signInAnonymously().then(() => {
  uid = firebase.auth().currentUser.uid;
  loadChats(uid);
});

// Load Saved Chats
function loadChats(uid) {
  db.collection("users").doc(uid).collection("chats")
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      const chatList = document.getElementById("chat-list");
      chatList.innerHTML = "";

      snapshot.forEach(doc => {
        const chat = doc.data();
        const chatDiv = document.createElement("div");
        chatDiv.textContent = chat.title || "Untitled Chat";
        chatDiv.onclick = () => {
          currentChatId = doc.id;
          chatBox.innerHTML = "";
          loadChatHistory(uid, currentChatId);
        };
        chatList.appendChild(chatDiv);
      });
    });
}

function startNewChat() {
  db.collection("users").doc(uid).collection("chats").add({
    title: "New Chat",
    timestamp: Date.now()
  }).then(docRef => {
    currentChatId = docRef.id;
    chatBox.innerHTML = "";
    loadChats(uid);
  });
}

function sendMessage() {
  const message = userInput.value.trim();
  if (message === "" || !currentChatId) return;

  displayMessage("You", message, "user-message");
  saveMessage("user", message);
  userInput.value = "";

  const thinkingMessage = displayMessage("Strait-AI", "thinking...", "bot-message", true);

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: message })
  })
    .then(res => res.json())
    .then(data => {
      chatBox.removeChild(thinkingMessage);
      displayMessage("Strait-AI", data.response, "bot-message");
      saveMessage("bot", data.response);
    });
}

function saveMessage(role, text) {
  if (!uid || !currentChatId) return;
  db.collection("users").doc(uid).collection("chats")
    .doc(currentChatId).collection("messages").add({
      role,
      text,
      timestamp: Date.now()
    });
}

function loadChatHistory(uid, chatId) {
  db.collection("users").doc(uid).collection("chats")
    .doc(chatId).collection("messages")
    .orderBy("timestamp")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const msg = doc.data();
        displayMessage(
          msg.role === "user" ? "You" : "Strait-AI",
          msg.text,
          msg.role === "user" ? "user-message" : "bot-message"
        );
      });
    });
}

function displayMessage(name, text, type, isThinking = false) {
  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "slide-in", type);

  let nameDiv = document.createElement("div");
  nameDiv.classList.add("username");
  nameDiv.textContent = name;

  let textDiv = document.createElement("div");
  textDiv.classList.add("text");
  textDiv.textContent = text;

  if (isThinking) {
    textDiv.classList.add("typing");
    animateDots(textDiv);
  }

  messageDiv.appendChild(nameDiv);
  messageDiv.appendChild(textDiv);
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  return messageDiv;
}

function animateDots(element) {
  const dots = ["thinking.", "thinking..", "thinking..."];
  let count = 0;
  let interval = setInterval(() => {
    element.textContent = dots[count % dots.length];
    count++;
  }, 500);
  element.dataset.interval = interval;
}
