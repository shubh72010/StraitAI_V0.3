firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    await firebase.auth().signInAnonymously();
  }
});

const chatContainer = document.getElementById("chat");
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "ai-msg";
  msg.textContent = text;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function saveMessage(uid, chatId, sender, message, timestamp) {
  await db
    .collection("users")
    .doc(uid)
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .add({
      sender,
      message,
      timestamp: timestamp || firebase.firestore.FieldValue.serverTimestamp(),
    });
}

async function fetchMessages(uid, chatId) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("timestamp")
    .get();

  snapshot.forEach((doc) => {
    const msg = doc.data();
    appendMessage(msg.sender, msg.message);
  });
}

sendBtn.addEventListener("click", async () => {
  const text = inputBox.value.trim();
  if (!text) return;

  const user = firebase.auth().currentUser;
  const chatId = "default-chat";

  appendMessage("user", text);
  inputBox.value = "";
  typingIndicator.style.display = "block";

  await saveMessage(user.uid, chatId, "user", text);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: text }),
  });

  const data = await res.json();
  appendMessage("ai", data.response);
  await saveMessage(user.uid, chatId, "ai", data.response);
  typingIndicator.style.display = "none";
});

window.onload = async () => {
  const user = await new Promise((resolve) =>
    firebase.auth().onAuthStateChanged((user) => resolve(user))
  );
  await fetchMessages(user.uid, "default-chat");
};