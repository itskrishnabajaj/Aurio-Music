const firebaseConfig = {
    apiKey: "AIzaSyCMY1H6-QLhtUfo6J42Al3DkfAkd1b6qcE",
    authDomain: "aurio-music-app.firebaseapp.com",
    databaseURL: "https://aurio-music-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aurio-music-app",
    storageBucket: "aurio-music-app.firebasestorage.app",
    messagingSenderId: "849403275884",
    appId: "1:849403275884:web:79a001b4cc1837c2260649"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
const database = db;  // Alias for compatibility
