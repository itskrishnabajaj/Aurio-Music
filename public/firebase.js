// TEST firebase.js - Replace your current one
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCMY1H6-QLhtUfo6J42Al3DkfAkd1b6qcE",
  authDomain: "aurio-music-app.firebaseapp.com",
  projectId: "aurio-music-app",
  storageBucket: "aurio-music-app.firebasestorage.app",
  messagingSenderId: "849403275884",
  appId: "1:849403275884:web:79a001b4cc1837c2260649"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('Firebase loaded:', app.name);

window.auth = auth; // Global for testing
window.firebaseConfig = firebaseConfig;
