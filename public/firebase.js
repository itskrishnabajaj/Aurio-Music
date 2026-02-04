// Firebase Configuration

const firebaseConfig = {
  apiKey: "AIzaSyCMY1H6-QLhtUfo6J42Al3DkfAkd1b6qcE",
  authDomain: "aurio-music-app.firebaseapp.com",
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
}

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Configure reCAPTCHA for phone auth (invisible)
window.recaptchaVerifier = null;

// Admin emails whitelist (add your admin Google emails here)
const ADMIN_EMAILS = [
    'krisxmusic@gmail.com',
    'imkrishnabajaj@gmail.com'
];

// Check if user is admin
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

// Initialize reCAPTCHA verifier for phone auth
function initRecaptcha(elementId = 'recaptcha-container') {
    if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
    }
    
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(elementId, {
        'size': 'invisible',
        'callback': (response) => {
            console.log('✅ reCAPTCHA verified');
        },
        'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired');
            window.recaptchaVerifier = null;
        }
    });
    
    return window.recaptchaVerifier;
}

// Clear reCAPTCHA
function clearRecaptcha() {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
}
