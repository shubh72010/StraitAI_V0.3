import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let currentChatId = null;

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");
const newChatBtn = document.getElementById("new-chat-btn");
const savedChatsList = document.getElementById("saved-chats");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

// Toggle sidebar visibility
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// Sign in anonymously to Firebase
signInAnonymously(auth).catch(console.error);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadSavedChats();
    if (!currentChatId) {
      createNewChat();
    }
  }
});

// Load saved chats from Firestore
async function loadSavedChats() {
  const user = auth.currentUser;
  if (user) {
    const chatsRef = collection(db, "users", user.uid, "chats");
    const q = query(chatsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    savedChatsList.innerHTML = "";
    querySnapshot.forEach((docSnapshot) => {
      const chat = docSnapshot.data();
      const li = document.createElement("li");
      li.textContent = chat.name;
      li.setAttribute("data-chat-id", docSnapshot.id);
      // Single click to select chat; double-click to rename
      li.addEventListener("click", () => selectChat(docSnapshot.id));
      li.addEventListener("dblclick", () => renameChatPrompt(docSnapshot.id, chat.name));
      savedChatsList.appendChild(li);
    });
  }
}

// Create a new chat with an auto-generated name
async function createNewChat() {
  const user = auth.currentUser;
  if (!user) return;
  let chatName = "Chat " + new Date().toLocaleString();
  const chatsRef = collection(db, "users", user.uid, "chats");
  const newChatRef = await addDoc(chatsRef, {
    name: chatName,
    createdAt: serverTimestamp()
  });
  currentChatId = newChatRef.id;
  chatBox.innerHTML = ""; // Clear the chat window for the new chat
  loadSavedChats();
}

// Select a chat from the sidebar and load its messages
async function selectChat(chatId) {
  currentChatId = chatId;
  loadChatMessages(chatId);
}

// Load messages for the selected chat and render them
async function loadChatMessages(chatId) {
  const user = auth.currentUser;
  if (!user || !chatId) return;
  const messagesRef = collection(db, "users", user.uid, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const querySnapshot = await getDocs(q);
  chatBox.innerHTML = "";
  querySnapshot.forEach((docSnapshot) => {
    const msg = docSnapshot.data();
    displayMessage(msg.text, msg.sender, false);
  });
}

// Append a message to the chat window and optionally save it
function displayMessage(text, sender, save = true) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (save && currentChatId) {
    saveMessage(text, sender);
  }
}

// Save a message to Firestore under the current chat
async function saveMessage(text, sender) {
  const user = auth.currentUser;
  if (!user || !currentChatId) return;
  try {
    const messagesRef = collection(db, "users", user.uid, "chats", currentChatId, "messages");
    await addDoc(messagesRef, {
      text: text,
      sender: sender,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

// Handle the chat form submission: send message to API and display responses
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;
  
  // Display user's message and save it
  displayMessage(input, "user");
  userInput.value = "";
  typingIndicator.style.display = "block";
  
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input })
    });
    const data = await res.json();
    typingIndicator.style.display = "none";
    displayMessage(data.response, "bot");
  } catch (err) {
    typingIndicator.style.display = "none";
    console.error("Error calling chat API:", err);
  }
});

// Prompt the user to rename a chat (triggered on double-click)
function renameChatPrompt(chatId, currentName) {
  const newName = prompt("Enter new name for this chat:", currentName);
  if (newName && newName !== currentName) {
    renameChat(chatId, newName);
  }
}

// Update the chat name in Firestore and refresh the sidebar
async function renameChat(chatId, newName) {
  const user = auth.currentUser;
  if (!user) return;
  const chatDocRef = doc(db, "users", user.uid, "chats", chatId);
  try {
    await updateDoc(chatDocRef, { name: newName });
    loadSavedChats();
  } catch (error) {
    console.error("Error renaming chat:", error);
  }
}