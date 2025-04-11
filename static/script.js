document.addEventListener("DOMContentLoaded", () => {
  const waitForFirebase = () => {
    return new Promise((resolve, reject) => {
      const maxRetries = 20;
      let attempts = 0;

      const check = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          resolve();
        } else {
          attempts++;
          if (attempts > maxRetries) reject("Firebase not loaded.");
          else setTimeout(check, 100);
        }
      };

      check();
    });
  };

  waitForFirebase()
    .then(() => {
      initStraitApp(); // your whole app starts here
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to load Firebase. Try refreshing.");
    });
});

function initStraitApp() {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const API_URL = "/api/chat";
  const sidebar = document.getElementById("sidebar");
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const sendButton = document.getElementById("send-button");
  const newChatButton = document.getElementById("new-chat-button");
  const chatList = document.getElementById("chat-list");

  const firebaseConfig = {
    apiKey: "AIzaSyD6qceA3bsMVb5fAE--699_omZEQxLCeAM",
    authDomain: "straitai-v03.firebaseapp.com",
    projectId: "straitai-v03",
    storageBucket: "straitai-v03.appspot.com",
    messagingSenderId: "365452252559",
    appId: "1:365452252559:web:c83fdf6109666f1c7027fa",
    measurementId: "G-XYL9Y3QB0W",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  let uid = null;
  let currentChatId = null;

  firebase.auth().signInAnonymously().then(() => {
    uid = firebase.auth().currentUser.uid;
    loadChats(uid);
  });

  hamburgerMenu.addEventListener("click", function () {
    sidebar.classList.toggle("hidden");
  });

  sendButton.addEventListener("click", function () {
    sendMessage();
  });

  userInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

  newChatButton.addEventListener("click", function () {
    startNewChat();
  });

  function loadChats(uid) {
    db.collection("users")
      .doc(uid)
      .collection("chats")
      .orderBy("timestamp", "desc")
      .get()
      .then((snapshot) => {
        chatList.innerHTML = "";
        snapshot.forEach((doc) => {
          const chat = doc.data();
          const chatDiv = document.createElement("div");
          chatDiv.textContent = chat.title || "New Chat";
          chatDiv.onclick = () => {
            currentChatId = doc.id;
            chatBox.innerHTML = "";
            loadChatHistory(uid, currentChatId);
          };
          chatDiv.ondblclick = () => {
            const currentTitle = chatDiv.textContent;
            chatDiv.contentEditable = true;
            chatDiv.focus();
            chatDiv.onblur = () => {
              const newTitle = chatDiv.textContent;
              if (newTitle !== currentTitle) {
                renameChat(doc.id, newTitle);
              }
              chatDiv.contentEditable = false;
            };
            chatDiv.onkeydown = (event) => {
              if (event.key === "Enter") {
                chatDiv.blur();
              }
            };
          };
          chatList.appendChild(chatDiv);
        });
      })
      .catch((error) => {
        console.error("Error loading chats:", error);
      });
  }

  function startNewChat() {
    console.log("startNewChat called");
    db.collection("users")
      .doc(uid)
      .collection("chats")
      .add({
        title: "New Chat",
        timestamp: Date.now(),
      })
      .then((docRef) => {
        currentChatId = docRef.id;
        console.log("New chat created with id", currentChatId);
        chatBox.innerHTML = "";
        loadChats(uid);
      })
      .catch((error) => {
        console.error("Error creating new chat:", error);
      });
  }

  function sendMessage() {
    const message = userInput.value.trim();
    console.log(
      "sendMessage function called, message:",
      message,
      "currentChatId:",
      currentChatId
    );
    if (message === "" || !currentChatId) {
      console.log("Message is empty or currentChatId is not set.");
      return;
    }

    displayMessage("You", message, "user-message");
    saveMessage("user", message);
    userInput.value = "";

    const thinkingMessage = displayMessage(
      "Strait-AI",
      "thinking...",
      "bot-message",
      true
    );

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: message }),
    })
      .then((res) => res.json())
      .then((data) => {
        chatBox.removeChild(thinkingMessage);
        displayMessage("Strait-AI", data.response, "bot-message");
        saveMessage("bot", data.response);
      })
      .catch((error) => {
        console.error("Error during fetch operation:", error);
        chatBox.removeChild(thinkingMessage);
        displayMessage(
          "Strait-AI",
          "Error: Could not get a response.",
          "bot-message"
        );
      });
  }

  function saveMessage(role, text) {
    if (!uid || !currentChatId) {
      console.log("saveMessage: uid or currentChatId is not set.");
      return;
    }
    db.collection("users")
      .doc(uid)
      .collection("chats")
      .doc(currentChatId)
      .collection("messages")
      .add({
        role,
        text,
        timestamp: Date.now(),
      })
      .catch((error) => {
        console.error("Error saving message:", error);
      });
  }

  function loadChatHistory(uid, chatId) {
    console.log("loadChatHistory called, uid:", uid, "chatId:", chatId);
    db.collection("users")
      .doc(uid)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp")
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const msg = doc.data();
          displayMessage(
            msg.role === "user" ? "You" : "Strait-AI",
            msg.text,
            msg.role === "user" ? "user-message" : "bot-message"
          );
        });
      })
      .catch((error) => {
        console.error("Error loading chat history:", error);
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

  function renameChat(chatId, newTitle) {
    if (!uid) return;
    db.collection("users")
      .doc(uid)
      .collection("chats")
      .doc(chatId)
      .update({
        title: newTitle,
      })
      .then(() => {
        loadChats(uid);
      })
      .catch((error) => {
        console.error("Error renaming chat:", error);
      });
  }
}
