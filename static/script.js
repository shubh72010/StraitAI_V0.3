// Firebase config and init
const firebaseConfig = {
  apiKey: "AIzaSyD6qceA3bsMVb5fAE--699_omZEQxLCeAM",
  authDomain: "straitai-v03.firebaseapp.com",
  projectId: "straitai-v03",
  storageBucket: "straitai-v03.appspot.com",
  messagingSenderId: "365452252559",
  appId: "1:365452252559:web:c83fdf6109666f1c7027fa",
  measurementId: "G-XYL9Y3QB0W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let userId = localStorage.getItem("userId") || crypto.randomUUID();
localStorage.setItem("userId", userId);

// DOM refs
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Message rendering
function addMessage(content, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}-message`;
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Save to Firestore
async function saveMessage(content, sender) {
  const chatRef = db.collection("users").doc(userId).collection("chats").doc("default").collection("messages");
  await chatRef.add({
    sender,
    content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Load messages
async function loadChat() {
  const msgs = await db
    .collection("users")
    .doc(userId)
    .collection("chats")
    .doc("default")
    .collection("messages")
    .orderBy("timestamp")
    .get();

  msgs.forEach(doc => {
    const { sender, content } = doc.data();
    addMessage(content, sender);
  });
}

// Handle send
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  saveMessage(text, "user");
  userInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message bot-message";
  typing.innerHTML = 'Typing<span class="typing-indicator"></span>';
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text })
    });

    const data = await res.json();
    chatBox.removeChild(typing);
    addMessage(data.response, "bot");
    saveMessage(data.response, "bot");
  } catch (err) {
    chatBox.removeChild(typing);
    addMessage("Brain fart. Something broke.", "bot");
  }
}

// Events
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleSend();
});

// Init
loadChat();