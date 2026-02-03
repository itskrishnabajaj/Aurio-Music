// Admin Panel Logic for Aurio

// DOM Elements
const adminAuthScreen = document.getElementById('adminAuthScreen');
const adminDashboard = document.getElementById('adminDashboard');
const adminGoogleSignInBtn = document.getElementById('adminGoogleSignIn');
const adminSignOutBtn = document.getElementById('adminSignOut');
const addSongForm = document.getElementById('addSongForm');
const adminSongList = document.getElementById('adminSongList');
const toast = document.getElementById('toast');

// Form Fields
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const songCover = document.getElementById('songCover');
const songAudio = document.getElementById('songAudio');

// State
let currentAdmin = null;
let allSongs = [];

// Initialize Admin Panel
function initAdmin() {
    auth.onAuthStateChanged(user => {
        if (user && isAdmin(user.email)) {
            currentAdmin = user;
            showDashboard();
            loadAdminSongs();
        } else if (user && !isAdmin(user.email)) {
            showToast('Access Denied: You are not an admin', 'error');
            auth.signOut();
        } else {
            currentAdmin = null;
            showAdminAuth();
        }
    });

    // Event Listeners
    adminGoogleSignInBtn.addEventListener('click', adminSignIn);
    adminSignOutBtn.addEventListener('click', adminSignOut);
    addSongForm.addEventListener('submit', handleAddSong);
}

// Authentication
function adminSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => {
            console.error('Admin sign in error:', error);
            showToast('Sign in failed. Please try again.', 'error');
        });
}

function adminSignOut() {
    auth.signOut()
        .then(() => {
            showToast('Signed out successfully', 'success');
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
}

// UI Control
function showAdminAuth() {
    adminAuthScreen.classList.add('active');
    adminDashboard.classList.remove('active');
}

function showDashboard() {
    adminAuthScreen.classList.remove('active');
    adminDashboard.classList.add('active');
}

// Load Songs
function loadAdminSongs() {
    adminSongList.innerHTML = '<div class="loading">Loading songs...</div>';
    
    database.ref('songs').on('value', snapshot => {
        const data = snapshot.val();
        allSongs = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                allSongs.push({ id: key, ...data[key] });
            });
        }
        
        renderAdminSongs();
    }, error => {
        console.error('Error loading songs:', error);
        adminSongList.innerHTML = '<div class="error">Failed to load songs</div>';
    });
}

// Render Admin Songs
function renderAdminSongs() {
    if (allSongs.length === 0) {
        adminSongList.innerHTML = '<div class="empty">No songs yet. Add your first song above!</div>';
        return;
    }
    
    adminSongList.innerHTML = allSongs.map(song => `
        <div class="admin-song-card">
            <img src="${song.coverUrl || 'https://via.placeholder.com/80'}" alt="${song.title}" class="admin-song-cover">
            <div class="admin-song-details">
                <div class="admin-song-title">${song.title}</div>
                <div class="admin-song-artist">${song.artist}</div>
                <div class="admin-song-meta">
                    Plays: ${song.playCount || 0} | Added: ${formatDate(song.addedAt)}
                </div>
            </div>
            <button class="btn-danger" onclick="deleteSong('${song.id}', '${song.title}')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
            </button>
        </div>
    `).join('');
}

// Add Song
function handleAddSong(e) {
    e.preventDefault();
    
    const newSong = {
        title: songTitle.value.trim(),
        artist: songArtist.value.trim(),
        coverUrl: songCover.value.trim(),
        audioUrl: songAudio.value.trim(),
        addedAt: Date.now(),
        playCount: 0,
        addedBy: currentAdmin.email
    };
    
    // Validate URLs
    if (!isValidUrl(newSong.coverUrl) || !isValidUrl(newSong.audioUrl)) {
        showToast('Please enter valid URLs', 'error');
        return;
    }
    
    database.ref('songs').push(newSong)
        .then(() => {
            showToast('Song added successfully!', 'success');
            addSongForm.reset();
        })
        .catch(error => {
            console.error('Error adding song:', error);
            showToast('Failed to add song. Please try again.', 'error');
        });
}

// Delete Song
function deleteSong(songId, songTitle) {
    if (!confirm(`Delete "${songTitle}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    database.ref(`songs/${songId}`).remove()
        .then(() => {
            showToast('Song deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting song:', error);
            showToast('Failed to delete song', 'error');
        });
}

// Utilities
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
initAdmin();