// Main App Logic for Aurio Music Player

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const googleSignInBtn = document.getElementById('googleSignIn');
const signOutBtn = document.getElementById('signOutBtn');
const userAvatar = document.getElementById('userAvatar');
const songList = document.getElementById('songList');
const audioPlayer = document.getElementById('audioPlayer');
const playerBar = document.getElementById('playerBar');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playerCover = document.getElementById('playerCover');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// App State
let currentUser = null;
let songs = [];
let currentSongIndex = -1;
let isPlaying = false;

// Initialize App
function init() {
    // Handle redirect result first (for mobile OAuth)
    auth.getRedirectResult()
        .then(result => {
            if (result.user) {
                console.log('✅ Signed in via redirect:', result.user.email);
            }
        })
        .catch(error => {
            console.error('Redirect error:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                showError(`Authentication error: ${error.message}`);
            }
        });

    // Auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('✅ User signed in:', user.email);
            showApp();
            loadSongs();
        } else {
            currentUser = null;
            showAuth();
        }
    });

    // Event Listeners
    googleSignInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    
    // Audio Events
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('error', handleAudioError);
    
    // Progress Bar
    progressBar.addEventListener('input', seekAudio);
}

// Authentication
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Mobile: use redirect (more reliable)
        console.log('Using redirect sign-in for mobile...');
        auth.signInWithRedirect(provider);
    } else {
        // Desktop: use popup
        console.log('Using popup sign-in for desktop...');
        auth.signInWithPopup(provider)
            .catch(error => {
                console.error('Popup sign in failed:', error);
                if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                    console.log('Popup blocked/cancelled, trying redirect...');
                    auth.signInWithRedirect(provider);
                } else if (error.code !== 'auth/popup-closed-by-user') {
                    showError(`Sign in failed: ${error.message}`);
                }
            });
    }
}

function signOut() {
    auth.signOut()
        .then(() => {
            pauseAudio();
            songs = [];
            currentSongIndex = -1;
            console.log('✅ Signed out');
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
}

// UI Control
function showAuth() {
    authScreen.classList.add('active');
    appScreen.classList.remove('active');
}

function showApp() {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
    userAvatar.src = currentUser.photoURL || 'https://via.placeholder.com/40';
    userAvatar.alt = currentUser.displayName || 'User';
}

function showError(message) {
    const existingError = document.querySelector('.error-toast');
    if (existingError) existingError.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Load Songs from Firebase
function loadSongs() {
    songList.innerHTML = '<div class="loading">Loading songs...</div>';
    
    database.ref('songs').on('value', snapshot => {
        const data = snapshot.val();
        songs = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                songs.push({ id: key, ...data[key] });
            });
        }
        
        renderSongs();
    }, error => {
        console.error('Error loading songs:', error);
        songList.innerHTML = '<div class="error">Failed to load songs. Please refresh.</div>';
    });
}

// Render Songs
function renderSongs() {
    if (songs.length === 0) {
        songList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No songs available yet</p>
                <p class="subtitle">Add songs from admin panel</p>
            </div>
        `;
        return;
    }
    
    songList.innerHTML = songs.map((song, index) => `
        <div class="song-item" data-index="${index}">
            <img src="${song.coverUrl || 'https://via.placeholder.com/60'}" alt="${song.title}" class="song-cover" onerror="this.src='https://via.placeholder.com/60?text=♪'">
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <button class="play-song-btn" data-index="${index}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.play-song-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            playSong(index);
        });
    });
}

// Playback Functions
function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    
    currentSongIndex = index;
    const song = songs[index];
    
    audioPlayer.src = song.audioUrl;
    audioPlayer.load();
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayerUI();
            showPlayer();
            incrementPlayCount(song.id);
        })
        .catch(error => {
            console.error('Playback error:', error);
            showError('Failed to play song. Audio file may be unavailable.');
        });
}

function togglePlayPause() {
    if (!audioPlayer.src) return;
    
    if (isPlaying) {
        pauseAudio();
    } else {
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayerUI();
            })
            .catch(error => {
                console.error('Play error:', error);
                showError('Playback failed');
            });
    }
}

function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayerUI();
}

function playNext() {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
}

function playPrevious() {
    if (songs.length === 0) return;
    const prevIndex = currentSongIndex - 1 < 0 ? songs.length - 1 : currentSongIndex - 1;
    playSong(prevIndex);
}

// Player UI Updates
function updatePlayerUI() {
    if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
        const song = songs[currentSongIndex];
        playerCover.src = song.coverUrl || 'https://via.placeholder.com/60';
        playerCover.onerror = () => playerCover.src = 'https://via.placeholder.com/60?text=♪';
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
    }
    
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function showPlayer() {
    playerBar.classList.remove('hidden');
}

function updateDuration() {
    const duration = audioPlayer.duration;
    if (!isNaN(duration) && isFinite(duration)) {
        durationEl.textContent = formatTime(duration);
        progressBar.max = Math.floor(duration);
    }
}

function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    if (!isNaN(currentTime)) {
        currentTimeEl.textContent = formatTime(currentTime);
        progressBar.value = Math.floor(currentTime);
    }
}

function seekAudio(e) {
    const seekTime = parseInt(e.target.value);
    audioPlayer.currentTime = seekTime;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleAudioError(e) {
    console.error('Audio error:', e);
    showError('Error playing audio. File may be unavailable.');
    isPlaying = false;
    updatePlayerUI();
}

// Firebase Analytics
function incrementPlayCount(songId) {
    if (!songId) return;
    const playCountRef = database.ref(`songs/${songId}/playCount`);
    playCountRef.transaction(count => (count || 0) + 1);
}

// Security: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load
init();
