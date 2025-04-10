import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyD6qceA3bsMVb5fAE--699_omZEQxLCeAM",
  authDomain: "straitai-v03.firebaseapp.com",
  projectId: "straitai-v03",
  storageBucket: "straitai-v03.appspot.com",
  messagingSenderId: "365452252559",
  appId: "1:365452252559:web:c83fdf6109666f1c7027fa",
  measurementId: "G-XYL9Y3QB0W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export
export { db, auth, collection, addDoc, getDocs, query, orderBy, onAuthStateChanged, signInAnonymously };