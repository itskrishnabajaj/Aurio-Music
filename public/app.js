// Global State
let currentUser = null;
let currentUserProfile = null;
let allSongs = [];
let currentSong = null;
let currentPlaylist = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0: off, 1: all, 2: one

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');

// Auth Buttons
const googleSignInBtn = document.getElementById('googleSignInBtn');
const phoneSignInBtn = document.getElementById('phoneSignInBtn');
const guestSignInBtn = document.getElementById('guestSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');

// Phone Auth Modal
const phoneAuthModal = document.getElementById('phoneAuthModal');
const closePhoneModal = document.getElementById('closePhoneModal');
const phoneStep1 = document.getElementById('phoneStep1');
const phoneStep2 = document.getElementById('phoneStep2');
const countryCode = document.getElementById('countryCode');
const phoneNumber = document.getElementById('phoneNumber');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpCode = document.getElementById('otpCode');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');
const searchBtn = document.getElementById('searchBtn');
const profileBtn = document.getElementById('profileBtn');

// Search
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResults = document.getElementById('searchResults');

// Profile
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const totalPlaysCount = document.getElementById('totalPlaysCount');
const likedSongsCount = document.getElementById('likedSongsCount');
const playlistsCount = document.getElementById('playlistsCount');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditModal = document.getElementById('closeEditModal');
const editProfileName = document.getElementById('editProfileName');
const avatarGrid = document.getElementById('avatarGrid');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Content Lists
const recentlyPlayedList = document.getElementById('recentlyPlayedList');
const dailyMixList = document.getElementById('dailyMixList');
const favoriteArtistsList = document.getElementById('favoriteArtistsList');
const recommendedList = document.getElementById('recommendedList');
const playlistsList = document.getElementById('playlistsList');
const greetingText = document.getElementById('greetingText');

// Player
const player = document.getElementById('player');
const audioPlayer = document.getElementById('audioPlayer');
const playerCover = document.getElementById('playerCover');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerLikeBtn = document.getElementById('playerLikeBtn');
const playerPrevBtn = document.getElementById('playerPrevBtn');
const playerPlayBtn = document.getElementById('playerPlayBtn');
const playerNextBtn = document.getElementById('playerNextBtn');
const playerProgressBar = document.getElementById('playerProgressBar');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

// Full Player
const fullPlayerModal = document.getElementById('fullPlayerModal');
const closeFullPlayer = document.getElementById('closeFullPlayer');
const openPlayerDetails = document.getElementById('openPlayerDetails');
const fullPlayerCover = document.getElementById('fullPlayerCover');
const fullPlayerTitle = document.getElementById('fullPlayerTitle');
const fullPlayerArtist = document.getElementById('fullPlayerArtist');
const fullPlayerCurrentTime = document.getElementById('fullPlayerCurrentTime');
const fullPlayerDuration = document.getElementById('fullPlayerDuration');
const fullPlayerSeekBar = document.getElementById('fullPlayerSeekBar');
const fullPlayerProgressFill = document.getElementById('fullPlayerProgressFill');
const fullPlayerShuffleBtn = document.getElementById('fullPlayerShuffleBtn');
const fullPlayerPrevBtn = document.getElementById('fullPlayerPrevBtn');
const fullPlayerPlayBtn = document.getElementById('fullPlayerPlayBtn');
const fullPlayerNextBtn = document.getElementById('fullPlayerNextBtn');
const fullPlayerRepeatBtn = document.getElementById('fullPlayerRepeatBtn');
const fullPlayerLikeBtn = document.getElementById('fullPlayerLikeBtn');
const fullPlayIcon = document.getElementById('fullPlayIcon');
const fullPauseIcon = document.getElementById('fullPauseIcon');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    setupUIListeners();
    setupPlayerListeners();
    setupMediaSession();
    updateGreeting();
});

// Auth State Listener
firebaseAuth.auth.onAuthStateChanged(async (user) => {
    if (user) {
        showLoading();
        currentUser = user;
        
        try {
            currentUserProfile = await firebaseDB.getUserProfile(user.uid);
            await loadAppData();
            showApp();
        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Error loading user data');
            await firebaseAuth.signOut();
        } finally {
            hideLoading();
        }
    } else {
        currentUser = null;
        currentUserProfile = null;
        showAuth();
    }
});

// Setup Auth Listeners
function setupAuthListeners() {
    googleSignInBtn.addEventListener('click', async () => {
        showLoading();
        try {
            await firebaseAuth.signInWithGoogle();
        } catch (error) {
            hideLoading();
            showToast(getErrorMessage(error));
        }
    });
    
    phoneSignInBtn.addEventListener('click', () => {
        phoneAuthModal.classList.add('active');
        phoneStep1.classList.add('active');
        phoneStep2.classList.remove('active');
    });
    
    closePhoneModal.addEventListener('click', () => {
        phoneAuthModal.classList.remove('active');
        phoneNumber.value = '';
        otpCode.value = '';
    });
    
    sendOtpBtn.addEventListener('click', async () => {
        const phone = countryCode.value + phoneNumber.value.trim();
        
        if (!phoneNumber.value.trim()) {
            showToast('Please enter phone number');
            return;
        }
        
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';
        
        try {
            await firebaseAuth.sendPhoneOTP(phone);
            phoneStep1.classList.remove('active');
            phoneStep2.classList.add('active');
            showToast('OTP sent successfully');
        } catch (error) {
            showToast(getErrorMessage(error));
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
        }
    });
    
    verifyOtpBtn.addEventListener('click', async () => {
        const code = otpCode.value.trim();
        
        if (!code || code.length !== 6) {
            showToast('Please enter 6-digit code');
            return;
        }
        
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';
        
        try {
            await firebaseAuth.verifyPhoneOTP(code);
            phoneAuthModal.classList.remove('active');
        } catch (error) {
            showToast(getErrorMessage(error));
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify & Sign In';
        }
    });
    
    resendOtpBtn.addEventListener('click', async () => {
        const phone = countryCode.value + phoneNumber.value.trim();
        
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Resending...';
        
        try {
            await firebaseAuth.sendPhoneOTP(phone);
            showToast('OTP resent successfully');
        } catch (error) {
            showToast(getErrorMessage(error));
        } finally {
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = 'Resend Code';
        }
    });
    
    guestSignInBtn.addEventListener('click', async () => {
        showLoading();
        try {
            await firebaseAuth.signInAnonymously();
        } catch (error) {
            hideLoading();
            showToast(getErrorMessage(error));
        }
    });
    
    signOutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to sign out?')) {
            showLoading();
            try {
                await firebaseAuth.signOut();
            } catch (error) {
                hideLoading();
                showToast('Error signing out');
            }
        }
    });
}

// Setup UI Listeners
function setupUIListeners() {
    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
    
    searchBtn.addEventListener('click', () => {
        switchSection('search');
        searchInput.focus();
    });
    
    profileBtn.addEventListener('click', () => {
        switchSection('profile');
    });
    
    // Search
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchResults.innerHTML = '';
        clearSearchBtn.style.display = 'none';
    });
    
    // Profile
    editProfileBtn.addEventListener('click', () => {
        editProfileModal.classList.add('active');
        editProfileName.value = currentUserProfile.displayName || '';
        renderAvatarOptions();
    });
    
    closeEditModal.addEventListener('click', () => {
        editProfileModal.classList.remove('active');
    });
    
    saveProfileBtn.addEventListener('click', async () => {
        const newName = editProfileName.value.trim();
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        
        if (!newName) {
            showToast('Please enter a name');
            return;
        }
        
        showLoading();
        try {
            const updateData = {
                displayName: newName
            };
            
            if (selectedAvatar) {
                updateData.avatar = selectedAvatar.textContent;
            }
            
            await firebaseDB.updateUserProfile(currentUser.uid, updateData);
            currentUserProfile = { ...currentUserProfile, ...updateData };
            
            profileName.textContent = newName;
            profileAvatar.textContent = updateData.avatar || currentUserProfile.avatar;
            
            editProfileModal.classList.remove('active');
            showToast('Profile updated successfully');
        } catch (error) {
            showToast('Error updating profile');
        } finally {
            hideLoading();
        }
    });
    
    // Full Player Modal
    openPlayerDetails.addEventListener('click', () => {
        fullPlayerModal.classList.add('active');
    });
    
    closeFullPlayer.addEventListener('click', () => {
        fullPlayerModal.classList.remove('active');
    });
}

// Setup Player Listeners
function setupPlayerListeners() {
    playerPlayBtn.addEventListener('click', togglePlayPause);
    fullPlayerPlayBtn.addEventListener('click', togglePlayPause);
    
    playerPrevBtn.addEventListener('click', playPrevious);
    fullPlayerPrevBtn.addEventListener('click', playPrevious);
    
    playerNextBtn.addEventListener('click', playNext);
    fullPlayerNextBtn.addEventListener('click', playNext);
    
    playerLikeBtn.addEventListener('click', toggleLike);
    fullPlayerLikeBtn.addEventListener('click', toggleLike);
    
    fullPlayerShuffleBtn.addEventListener('click', toggleShuffle);
    fullPlayerRepeatBtn.addEventListener('click', toggleRepeat);
    
    // Audio events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnded);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    
    // Seek bar
    fullPlayerSeekBar.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
    });
}

// Setup Media Session API
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            audioPlayer.play();
            updatePlayState(true);
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            audioPlayer.pause();
            updatePlayState(false);
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
}

// Update Media Session Metadata
function updateMediaSession() {
    if ('mediaSession' in navigator && currentSong) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album || 'Unknown Album',
            artwork: [
                { src: currentSong.coverUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}

// Switch Section
function switchSection(sectionName) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    navBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}Section`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// Update Greeting
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    
    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 18) {
        greeting = 'Good afternoon';
    }
    
    greetingText.textContent = greeting;
}

// Render Avatar Options
function renderAvatarOptions() {
    const avatars = ['🎵', '🎸', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁', '🎼', '🎶', '🔊', '📻'];
    
    avatarGrid.innerHTML = avatars.map(avatar => `
        <div class="avatar-option ${avatar === currentUserProfile.avatar ? 'selected' : ''}" data-avatar="${avatar}">
            ${avatar}
        </div>
    `).join('');
    
    avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
            avatarGrid.querySelectorAll('.avatar-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
        });
    });
}

// Show/Hide Screens
function showAuth() {
    authScreen.classList.add('active');
    appScreen.classList.remove('active');
}

function showApp() {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
    updateProfile();
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Get Error Message
function getErrorMessage(error) {
    const errorMessages = {
        'auth/popup-closed-by-user': 'Sign in cancelled',
        'auth/cancelled-popup-request': 'Sign in cancelled',
        'auth/invalid-phone-number': 'Invalid phone number',
        'auth/missing-phone-number': 'Please enter phone number',
        'auth/invalid-verification-code': 'Invalid verification code',
        'auth/code-expired': 'Verification code expired',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    
    return errorMessages[error.code] || error.message || 'An error occurred';
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load App Data
async function loadAppData() {
    try {
        // Load all songs
        allSongs = await firebaseDB.getAllSongs();
        
        // Render content
        renderRecentlyPlayed();
        renderDailyMix();
        renderFavoriteArtists();
        renderRecommended();
        await renderPlaylists();
    } catch (error) {
        console.error('Error loading app data:', error);
        showToast('Error loading content');
    }
}

// Update Profile UI
function updateProfile() {
    if (currentUserProfile) {
        profileName.textContent = currentUserProfile.displayName || 'User';
        profileAvatar.textContent = currentUserProfile.avatar || '🎵';
        totalPlaysCount.textContent = currentUserProfile.totalPlays || 0;
        likedSongsCount.textContent = (currentUserProfile.likedSongs || []).length;
        playlistsCount.textContent = (currentUserProfile.playlists || []).length;
    }
}

// Render Recently Played
function renderRecentlyPlayed() {
    if (!currentUserProfile || !currentUserProfile.recentlyPlayed || currentUserProfile.recentlyPlayed.length === 0) {
        document.getElementById('recentlyPlayedBlock').style.display = 'none';
        return;
    }
    
    document.getElementById('recentlyPlayedBlock').style.display = 'block';
    
    const recentSongs = currentUserProfile.recentlyPlayed
        .map(songId => allSongs.find(s => s.id === songId))
        .filter(Boolean)
        .slice(0, 10);
    
    recentlyPlayedList.innerHTML = recentSongs.map(song => createSongCard(song)).join('');
    attachSongCardListeners(recentlyPlayedList);
}

// Render Daily Mix
function renderDailyMix() {
    const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
    const dailyMix = shuffled.slice(0, 10);
    
    dailyMixList.innerHTML = dailyMix.map(song => createSongCard(song)).join('');
    attachSongCardListeners(dailyMixList);
}

// Render Favorite Artists
function renderFavoriteArtists() {
    if (!currentUserProfile || !currentUserProfile.likedSongs || currentUserProfile.likedSongs.length === 0) {
        document.getElementById('favoriteArtistsBlock').style.display = 'none';
        return;
    }
    
    const likedSongs = currentUserProfile.likedSongs
        .map(songId => allSongs.find(s => s.id === songId))
        .filter(Boolean);
    
    const artistCounts = {};
    likedSongs.forEach(song => {
        artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    });
    
    const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artist]) => {
            const song = likedSongs.find(s => s.artist === artist);
            return {
                name: artist,
                image: song ? song.artistImage || song.coverUrl : ''
            };
        });
    
    if (topArtists.length === 0) {
        document.getElementById('favoriteArtistsBlock').style.display = 'none';
        return;
    }
    
    document.getElementById('favoriteArtistsBlock').style.display = 'block';
    
    favoriteArtistsList.innerHTML = topArtists.map(artist => `
        <div class="artist-card" data-artist="${artist.name}">
            <img src="${artist.image}" alt="${artist.name}" class="artist-avatar">
            <div class="artist-name">${artist.name}</div>
        </div>
    `).join('');
    
    favoriteArtistsList.querySelectorAll('.artist-card').forEach(card => {
        card.addEventListener('click', () => {
            const artist = card.dataset.artist;
            const artistSongs = allSongs.filter(s => s.artist === artist);
            playSongList(artistSongs, 0);
        });
    });
}

// Render Recommended
function renderRecommended() {
    let recommended = [];
    
    if (currentUserProfile && currentUserProfile.likedSongs && currentUserProfile.likedSongs.length > 0) {
        const likedSongs = currentUserProfile.likedSongs
            .map(songId => allSongs.find(s => s.id === songId))
            .filter(Boolean);
        
        const artists = [...new Set(likedSongs.map(s => s.artist))];
        const languages = [...new Set(likedSongs.map(s => s.language).filter(Boolean))];
        
        recommended = allSongs.filter(song => {
            return (artists.includes(song.artist) || languages.includes(song.language)) &&
                   !currentUserProfile.likedSongs.includes(song.id);
        });
        
        recommended = recommended.sort(() => 0.5 - Math.random()).slice(0, 10);
    }
    
    if (recommended.length === 0) {
        recommended = [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 10);
    }
    
    recommendedList.innerHTML = recommended.map(song => createSongCard(song)).join('');
    attachSongCardListeners(recommendedList);
}

// Render Playlists
async function renderPlaylists() {
    try {
        const playlists = await firebaseDB.getPlaylists();
        
        if (playlists.length === 0) {
            playlistsList.innerHTML = '<p style="color: var(--text-secondary);">No playlists available</p>';
            return;
        }
        
        playlistsList.innerHTML = playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <img src="${playlist.coverUrl || 'https://via.placeholder.com/150'}" alt="${playlist.name}" class="playlist-cover">
                <div class="playlist-title">${playlist.name}</div>
                <div class="playlist-desc">${playlist.description || ''}</div>
            </div>
        `).join('');
        
        playlistsList.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', async () => {
                const playlistId = card.dataset.playlistId;
                const songs = await firebaseDB.getPlaylistSongs(playlistId);
                if (songs.length > 0) {
                    playSongList(songs, 0);
                } else {
                    showToast('Playlist is empty');
                }
            });
        });
    } catch (error) {
        console.error('Error rendering playlists:', error);
    }
}

// Create Song Card
function createSongCard(song) {
    return `
        <div class="song-card" data-song-id="${song.id}">
            <img src="${song.coverUrl}" alt="${song.title}" class="song-cover">
            <div class="song-card-title">${song.title}</div>
            <div class="song-card-artist">${song.artist}</div>
        </div>
    `;
}

// Attach Song Card Listeners
function attachSongCardListeners(container) {
    container.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', () => {
            const songId = card.dataset.songId;
            const song = allSongs.find(s => s.id === songId);
            if (song) {
                const songList = Array.from(container.querySelectorAll('.song-card'))
                    .map(c => allSongs.find(s => s.id === c.dataset.songId))
                    .filter(Boolean);
                const index = songList.findIndex(s => s.id === songId);
                playSongList(songList, index);
            }
        });
    });
}

// Handle Search
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        searchResults.innerHTML = '';
        clearSearchBtn.style.display = 'none';
        return;
    }
    
    clearSearchBtn.style.display = 'block';
    
    const results = await firebaseDB.searchSongs(query);
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No results found</p>';
        return;
    }
    
    searchResults.innerHTML = results.map(song => `
        <div class="search-item" data-song-id="${song.id}">
            <img src="${song.coverUrl}" alt="${song.title}" class="search-item-cover">
            <div class="search-item-info">
                <div class="search-item-title">${song.title}</div>
                <div class="search-item-artist">${song.artist}</div>
            </div>
        </div>
    `).join('');
    
    searchResults.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
            const songId = item.dataset.songId;
            const song = allSongs.find(s => s.id === songId);
            if (song) {
                playSongList(results, results.findIndex(s => s.id === songId));
            }
        });
    });
}

// Play Song List
function playSongList(songs, startIndex = 0) {
    currentPlaylist = songs;
    currentIndex = startIndex;
    playSong(currentPlaylist[currentIndex]);
}

// Play Song
async function playSong(song) {
    if (!song) return;
    
    currentSong = song;
    
    // Update UI
    player.style.display = 'block';
    playerCover.src = song.coverUrl;
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    
    fullPlayerCover.src = song.coverUrl;
    fullPlayerTitle.textContent = song.title;
    fullPlayerArtist.textContent = song.artist;
    
    // Update like button
    updateLikeButton();
    
    // Load and play audio
    audioPlayer.src = song.audioUrl;
    await audioPlayer.play();
    updatePlayState(true);
    
    // Update media session
    updateMediaSession();
    
    // Add to recently played
    if (currentUser) {
        await firebaseDB.addToRecentlyPlayed(currentUser.uid, song.id);
        currentUserProfile.totalPlays = (currentUserProfile.totalPlays || 0) + 1;
        updateProfile();
    }
}

// Toggle Play/Pause
function togglePlayPause() {
    if (isPlaying) {
        audioPlayer.pause();
        updatePlayState(false);
    } else {
        audioPlayer.play();
        updatePlayState(true);
    }
}

// Update Play State
function updatePlayState(playing) {
    isPlaying = playing;
    
    if (playing) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        fullPlayIcon.style.display = 'none';
        fullPauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        fullPlayIcon.style.display = 'block';
        fullPauseIcon.style.display = 'none';
    }
}

// Play Previous
function playPrevious() {
    if (currentPlaylist.length === 0) return;
    
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
    } else {
        currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        playSong(currentPlaylist[currentIndex]);
    }
}

// Play Next
function playNext() {
    if (currentPlaylist.length === 0) return;
    
    if (isShuffle) {
        currentIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
        currentIndex = (currentIndex + 1) % currentPlaylist.length;
    }
    
    playSong(currentPlaylist[currentIndex]);
}

// Handle Song Ended
function handleSongEnded() {
    if (repeatMode === 2) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else if (repeatMode === 1 || currentIndex < currentPlaylist.length - 1) {
        playNext();
    } else {
        // Auto-play similar songs
        playAutoplayQueue();
    }
}

// Play Autoplay Queue (AI-based)
async function playAutoplayQueue() {
    if (!currentSong) return;
    
    // Rule-based AI: same artist → same language → similar tempo
    let nextSongs = [];
    
    // 1. Same artist
    nextSongs = allSongs.filter(s => s.artist === currentSong.artist && s.id !== currentSong.id);
    
    // 2. Same language
    if (nextSongs.length === 0 && currentSong.language) {
        nextSongs = allSongs.filter(s => s.language === currentSong.language && s.id !== currentSong.id);
    }
    
    // 3. Random
    if (nextSongs.length === 0) {
        nextSongs = allSongs.filter(s => s.id !== currentSong.id);
    }
    
    // Shuffle and pick
    nextSongs = nextSongs.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    if (nextSongs.length > 0) {
        playSongList(nextSongs, 0);
    }
}

// Toggle Like
async function toggleLike() {
    if (!currentUser || !currentSong) return;
    
    const isLiked = currentUserProfile.likedSongs.includes(currentSong.id);
    
    try {
        await firebaseDB.toggleLikeSong(currentUser.uid, currentSong.id, !isLiked);
        
        if (isLiked) {
            currentUserProfile.likedSongs = currentUserProfile.likedSongs.filter(id => id !== currentSong.id);
            showToast('Removed from liked songs');
        } else {
            currentUserProfile.likedSongs.push(currentSong.id);
            showToast('Added to liked songs');
        }
        
        updateLikeButton();
        updateProfile();
    } catch (error) {
        showToast('Error updating like status');
    }
}

// Update Like Button
function updateLikeButton() {
    if (!currentUser || !currentSong) return;
    
    const isLiked = currentUserProfile.likedSongs.includes(currentSong.id);
    
    if (isLiked) {
        playerLikeBtn.classList.add('liked');
        fullPlayerLikeBtn.classList.add('liked');
        playerLikeBtn.innerHTML = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>';
        fullPlayerLikeBtn.innerHTML = '<svg width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>';
    } else {
        playerLikeBtn.classList.remove('liked');
        fullPlayerLikeBtn.classList.remove('liked');
        playerLikeBtn.innerHTML = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>';
        fullPlayerLikeBtn.innerHTML = '<svg width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>';
    }
}

// Toggle Shuffle
function toggleShuffle() {
    isShuffle = !isShuffle;
    fullPlayerShuffleBtn.classList.toggle('active', isShuffle);
    showToast(isShuffle ? 'Shuffle on' : 'Shuffle off');
}

// Toggle Repeat
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    
    if (repeatMode === 0) {
        fullPlayerRepeatBtn.classList.remove('active');
        showToast('Repeat off');
    } else if (repeatMode === 1) {
        fullPlayerRepeatBtn.classList.add('active');
        fullPlayerRepeatBtn.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Zm3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/></svg>';
        showToast('Repeat all');
    } else {
        fullPlayerRepeatBtn.classList.add('active');
        fullPlayerRepeatBtn.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6Zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z"/><text x="6.5" y="10.5" font-family="Arial" font-size="6" fill="currentColor">1</text></svg>';
        showToast('Repeat one');
    }
}

// Update Progress
function updateProgress() {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    playerProgressBar.style.width = `${progress}%`;
    fullPlayerProgressFill.style.width = `${progress}%`;
    fullPlayerSeekBar.value = progress;
    
    fullPlayerCurrentTime.textContent = formatTime(audioPlayer.currentTime);
}

// Update Duration
function updateDuration() {
    fullPlayerDuration.textContent = formatTime(audioPlayer.duration);
    fullPlayerSeekBar.max = 100;
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
