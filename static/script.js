async function sendMessage() {
  const input = document.getElementById("user-input");
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  input.value = "";

  addTypingIndicator();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: msg })
  });

  const data = await res.json();
  removeTypingIndicator();
  addMessage("bot", data.response);
}

function addMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");

  const msg = document.createElement("div");
  msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");

  const content = document.createElement("div");
  content.classList.add("text");
  content.textContent = text;

  msg.appendChild(content);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function startNewChat() {
  document.getElementById("chat-box").innerHTML = "";
  document.getElementById("chat-title").textContent = "New Chat";
}

function addTypingIndicator() {
  const chatBox = document.getElementById("chat-box");
  const typing = document.createElement("div");
  typing.id = "typing";
  typing.textContent = "Strait-AI is thinking...";
  typing.classList.add("bot-message");
  chatBox.appendChild(typing);
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

// Edit message content on double click
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