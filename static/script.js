const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Firebase Setup (adjust config in HTML if needed)
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let typingBubble = null;

// Sign in anonymously
auth.signInAnonymously().catch(console.error);

// Track auth state
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadChatHistory();
  }
});

// Load chat from Firestore
function loadChatHistory() {
  db.collection("users")
    .doc(currentUser.uid)
    .collection("chats")
    .doc("main")
    .collection("messages")
    .orderBy("timestamp")
    .get()
    .then((querySnapshot) => {
      chatBox.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const msg = doc.data();
        addMessage(msg.sender, msg.text, msg.timestamp.toDate());
      });
    });
}

// Save chat to Firestore
function saveMessage(sender, text, timestamp) {
  db.collection("users")
    .doc(currentUser.uid)
    .collection("chats")
    .doc("main")
    .collection("messages")
    .add({ sender, text, timestamp: firebase.firestore.Timestamp.fromDate(timestamp) });
}

// Add message to UI
function addMessage(sender, text, time = new Date()) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");

  const content = document.createElement("div");
  content.textContent = text;
  msg.appendChild(content);

  const timestamp = document.createElement("div");
  timestamp.className = "timestamp";
  timestamp.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msg.appendChild(timestamp);

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Typing indicator
function showTypingIndicator() {
  typingBubble = document.createElement("div");
  typingBubble.className = "bot-message message";
  typingBubble.innerHTML = `<div class="typing-indicator">
    <span></span><span></span><span></span>
  </div>`;
  chatBox.appendChild(typingBubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  if (typingBubble) {
    chatBox.removeChild(typingBubble);
    typingBubble = null;
  }
}

// Handle send
function handleSend() {
  const query = userInput.value.trim();
  if (!query) return;

  addMessage("user", query);
  saveMessage("user", query, new Date());

  userInput.value = "";
  showTypingIndicator();

  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then((res) => res.json())
    .then((data) => {
      removeTypingIndicator();
      addMessage("bot", data.response);
      saveMessage("bot", data.response, new Date());
    })
    .catch((err) => {
      removeTypingIndicator();
      addMessage("bot", "Something went wrong...");
      console.error(err);
    });
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});