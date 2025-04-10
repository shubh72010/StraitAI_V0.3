import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, setDoc,
  getDocs, getDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6qceA3bsMVb5fAE--699_omZEQxLCeAM",
  authDomain: "straitai-v03.firebaseapp.com",
  projectId: "straitai-v03",
  storageBucket: "straitai-v03.appspot.com",
  messagingSenderId: "365452252559",
  appId: "1:365452252559:web:c83fdf6109666f1c7027fa",
  measurementId: "G-XYL9Y3QB0W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;
let chatId = "default"; // could be dynamic later

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    loadMessages();
  } else {
    await signInAnonymously(auth);
  }
});

async function sendMessage() {
  const input = document.getElementById("user-input");
  const msg = input.value.trim();
  if (!msg) return;

  const timestamp = new Date().toISOString();
  addMessage("user", msg, timestamp);
  saveMessage("user", msg, timestamp);
  input.value = "";

  addTypingIndicator();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: msg })
  });

  const data = await res.json();
  const botTimestamp = new Date().toISOString();
  removeTypingIndicator();
  addMessage("bot", data.response, botTimestamp);
  saveMessage("bot", data.response, botTimestamp);
}

function addMessage(sender, text, timestamp) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");

  const content = document.createElement("div");
  content.classList.add("text");
  content.textContent = text;

  const time = document.createElement("div");
  time.classList.add("timestamp");
  time.textContent = new Date(timestamp).toLocaleTimeString();

  msg.appendChild(content);
  msg.appendChild(time);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addTypingIndicator() {
  const chatBox = document.getElementById("chat-box");
  const typing = document.createElement("div");
  typing.id = "typing-indicator";
  typing.classList.add("bot-message");
  typing.textContent = "Strait-AI is thinking...";
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

async function saveMessage(sender, text, timestamp) {
  if (!userId) return;
  const msgData = {
    sender,
    text,
    timestamp
  };
  await addDoc(collection(db, "users", userId, "chats", chatId, "messages"), msgData);
}

async function loadMessages() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  const msgs = await getDocs(collection(db, "users", userId, "chats", chatId, "messages"));
  msgs.forEach((doc) => {
    const { sender, text, timestamp } = doc.data();
    addMessage(sender, text, timestamp);
  });
}