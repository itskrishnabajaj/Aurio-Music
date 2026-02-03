// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMY1H6-QLhtUfo6J42Al3DkfAkd1b6qcE",
    authDomain: "aurio-music-app.firebaseapp.com",
    databaseURL: "https://aurio-music-app-default-rtdb.firebaseio.com", // ← CRITICAL: ADD THIS
    projectId: "aurio-music-app",
    storageBucket: "aurio-music-app.firebasestorage.app",
    messagingSenderId: "849403275884",
    appId: "1:849403275884:web:79a001b4cc1837c2260649"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Firebase setup error. Check console.');
}

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Admin emails whitelist
const ADMIN_EMAILS = [
    'krisxmusic@gmail.com',
    'imkrishnabajaj@gmail.com'
];

// Check if user is admin
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}
