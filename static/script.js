// Firebase Setup
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let userId;

firebase.auth().signInAnonymously().then(res => {
  userId = res.user.uid;
  loadChatHistory();
});

async function sendMessage() {
  const input = document.getElementById("user-input");
  const msg = input.value.trim();
  if (!msg) return;

  const timestamp = Date.now();
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
  removeTypingIndicator();
  const botTime = Date.now();
  addMessage("bot", data.response, botTime);
  saveMessage("bot", data.response, botTime);
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
  time.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msg.appendChild(content);
  msg.appendChild(time);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveMessage(sender, text, timestamp) {
  db.collection("chats").doc(userId).collection("messages").add({ sender, text, timestamp });
}

function loadChatHistory() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  db.collection("chats").doc(userId).collection("messages").orderBy("timestamp")
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        const msg = doc.data();
        addMessage(msg.sender, msg.text, msg.timestamp);
      });
    });
}

function startNewChat() {
  document.getElementById("chat-box").innerHTML = "";
  db.collection("chats").doc(userId).collection("messages").get().then(snapshot => {
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  });
  document.getElementById("chat-title").textContent = "New Chat";
}

function addTypingIndicator() {
  const chatBox = document.getElementById("chat-box");
  const typing = document.createElement("div");
  typing.id = "typing";
  typing.classList.add("bot-message");

  const dots = document.createElement("div");
  dots.classList.add("typing-indicator");
  dots.innerHTML = '<span></span><span></span><span></span>';

  typing.appendChild(dots);
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

document.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("text")) {
    e.target.setAttribute("contenteditable", "true");
    e.target.focus();
  }
});

document.addEventListener("blur", (e) => {
  if (e.target.classList.contains("text")) {
    e.target.removeAttribute("contenteditable");
  }
}, true);

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}
