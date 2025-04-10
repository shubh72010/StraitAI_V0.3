const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");

auth.signInAnonymously().catch(console.error);

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  addMessage(input, "user");
  userInput.value = "";
  typingIndicator.style.display = "block";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: input }),
  });
  const data = await res.json();
  typingIndicator.style.display = "none";
  addMessage(data.response, "bot");

  const user = auth.currentUser;
  if (user) {
    const msgRef = db.collection("users").doc(user.uid)
      .collection("chats").doc("default")
      .collection("messages");
    await msgRef.add({
      text: input,
      sender: "user",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    await msgRef.add({
      text: data.response,
      sender: "bot",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
});