async function sendMessage() {
  const input = document.getElementById("user-input");
  const msg = input.value.trim();
  if (!msg) return;

  const timestamp = new Date().toISOString();
  addMessage("user", msg, timestamp);
  input.value = "";

  showTypingIndicator();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: msg })
  });

  const data = await res.json();
  hideTypingIndicator();

  const replyTime = new Date().toISOString();
  addMessage("bot", data.response, replyTime);

  saveToFirestore("user", msg, timestamp);
  saveToFirestore("bot", data.response, replyTime);
}

function addMessage(sender, text, timestamp) {
  const chatBox = document.getElementById("chat-box");

  const msg = document.createElement("div");
  msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");

  const content = document.createElement("div");
  content.textContent = text;

  const time = document.createElement("small");
  time.textContent = new Date(timestamp).toLocaleTimeString();
  time.style.display = "block";
  time.style.fontSize = "0.7rem";
  time.style.opacity = 0.6;

  msg.appendChild(content);
  msg.appendChild(time);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const chatBox = document.getElementById("chat-box");

  const typing = document.createElement("div");
  typing.id = "typing-indicator";
  typing.className = "bot-message typing-dots";
  typing.innerHTML = "<span></span><span></span><span></span>";

  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

function startNewChat() {
  document.getElementById("chat-box").innerHTML = "";
}

function saveToFirestore(sender, text, time) {
  db.collection("chats").add({
    sender,
    text,
    timestamp: time
  });
}

window.onload = async () => {
  const snapshot = await db.collection("chats").orderBy("timestamp").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    addMessage(data.sender, data.text, data.timestamp);
  });
};