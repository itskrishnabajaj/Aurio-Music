// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBKz8vHQY5x7mL3wN9pR2tV6uW8yX0zC1D",
    authDomain: "aurio-music.firebaseapp.com",
    projectId: "aurio-music",
    storageBucket: "aurio-music.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// RecaptchaVerifier instance
let recaptchaVerifier = null;
let confirmationResult = null;

// Initialize reCAPTCHA (invisible)
function initializeRecaptcha() {
    if (!recaptchaVerifier) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
                recaptchaVerifier = null;
            }
        });
    }
}

// Google Sign In
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        await createUserProfile(user);
        return user;
    } catch (error) {
        console.error('Google sign in error:', error);
        throw error;
    }
}

// Phone Sign In - Send OTP
async function sendPhoneOTP(phoneNumber) {
    try {
        initializeRecaptcha();
        
        confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
        console.log('OTP sent successfully');
        return true;
    } catch (error) {
        console.error('Phone auth error:', error);
        
        // Reset reCAPTCHA on error
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }
        
        throw error;
    }
}

// Phone Sign In - Verify OTP
async function verifyPhoneOTP(code) {
    try {
        if (!confirmationResult) {
            throw new Error('No confirmation result. Please request OTP again.');
        }
        
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        
        await createUserProfile(user);
        return user;
    } catch (error) {
        console.error('OTP verification error:', error);
        throw error;
    }
}

// Anonymous Sign In
async function signInAnonymously() {
    try {
        const result = await auth.signInAnonymously();
        const user = result.user;
        
        await createUserProfile(user, true);
        return user;
    } catch (error) {
        console.error('Anonymous sign in error:', error);
        throw error;
    }
}

// Create or Update User Profile
async function createUserProfile(user, isGuest = false) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            const defaultAvatars = ['🎵', '🎸', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁'];
            const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
            
            const userData = {
                uid: user.uid,
                displayName: isGuest ? 'Guest User' : (user.displayName || 'Music Lover'),
                email: user.email || null,
                phoneNumber: user.phoneNumber || null,
                photoURL: user.photoURL || null,
                avatar: randomAvatar,
                isGuest: isGuest,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likedSongs: [],
                recentlyPlayed: [],
                playlists: [],
                totalPlays: 0
            };
            
            await userRef.set(userData);
            return userData;
        } else {
            return userDoc.data();
        }
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Get User Profile
async function getUserProfile(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

// Update User Profile
async function updateUserProfile(uid, data) {
    try {
        await db.collection('users').doc(uid).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Like/Unlike Song
async function toggleLikeSong(uid, songId, isLiked) {
    try {
        const userRef = db.collection('users').doc(uid);
        const songRef = db.collection('songs').doc(songId);
        
        if (isLiked) {
            await userRef.update({
                likedSongs: firebase.firestore.FieldValue.arrayUnion(songId)
            });
            await songRef.update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
        } else {
            await userRef.update({
                likedSongs: firebase.firestore.FieldValue.arrayRemove(songId)
            });
            await songRef.update({
                likes: firebase.firestore.FieldValue.increment(-1)
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

// Add to Recently Played
async function addToRecentlyPlayed(uid, songId) {
    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            let recentlyPlayed = userDoc.data().recentlyPlayed || [];
            
            // Remove if already exists
            recentlyPlayed = recentlyPlayed.filter(id => id !== songId);
            
            // Add to beginning
            recentlyPlayed.unshift(songId);
            
            // Keep only last 20
            recentlyPlayed = recentlyPlayed.slice(0, 20);
            
            await userRef.update({
                recentlyPlayed,
                totalPlays: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        // Increment song play count
        await db.collection('songs').doc(songId).update({
            playCount: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Error adding to recently played:', error);
        throw error;
    }
}

// Get All Songs
async function getAllSongs() {
    try {
        const snapshot = await db.collection('songs').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting songs:', error);
        return [];
    }
}

// Get Songs by Artist
async function getSongsByArtist(artist) {
    try {
        const snapshot = await db.collection('songs')
            .where('artist', '==', artist)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting songs by artist:', error);
        return [];
    }
}

// Get Songs by Language
async function getSongsByLanguage(language) {
    try {
        const snapshot = await db.collection('songs')
            .where('language', '==', language)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting songs by language:', error);
        return [];
    }
}

// Search Songs
async function searchSongs(query) {
    try {
        const allSongs = await getAllSongs();
        const lowerQuery = query.toLowerCase();
        
        return allSongs.filter(song => {
            return (
                song.title.toLowerCase().includes(lowerQuery) ||
                song.artist.toLowerCase().includes(lowerQuery) ||
                (song.album && song.album.toLowerCase().includes(lowerQuery))
            );
        });
    } catch (error) {
        console.error('Error searching songs:', error);
        return [];
    }
}

// Get Playlists
async function getPlaylists() {
    try {
        const snapshot = await db.collection('playlists')
            .where('isPublic', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting playlists:', error);
        return [];
    }
}

// Get Playlist Songs
async function getPlaylistSongs(playlistId) {
    try {
        const playlistDoc = await db.collection('playlists').doc(playlistId).get();
        if (!playlistDoc.exists) return [];
        
        const songIds = playlistDoc.data().songs || [];
        if (songIds.length === 0) return [];
        
        const songs = [];
        for (const songId of songIds) {
            const songDoc = await db.collection('songs').doc(songId).get();
            if (songDoc.exists) {
                songs.push({ id: songDoc.id, ...songDoc.data() });
            }
        }
        
        return songs;
    } catch (error) {
        console.error('Error getting playlist songs:', error);
        return [];
    }
}

// Sign Out
async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

// Check if user is admin
async function isAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Export functions for global use
window.firebaseAuth = {
    signInWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    signInAnonymously,
    signOut,
    auth,
    db
};

window.firebaseDB = {
    getUserProfile,
    updateUserProfile,
    toggleLikeSong,
    addToRecentlyPlayed,
    getAllSongs,
    getSongsByArtist,
    getSongsByLanguage,
    searchSongs,
    getPlaylists,
    getPlaylistSongs,
    isAdmin
};
