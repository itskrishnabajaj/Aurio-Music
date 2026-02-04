// Aurio Main App - Complete Premium Music Player
// Version 2.1 - Fixed Authentication

// ==================== STATE MANAGEMENT ====================
const AppState = {
    currentUser: null,
    allSongs: [],
    playlists: [],
    likedSongs: new Set(),
    recentlyPlayed: [],
    currentSong: null,
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    repeat: 'off',
    queue: [],
    currentTab: 'home',
    settings: {
        theme: 'dark',
        crossfade: false,
        quality: 'high'
    }
};

// ==================== DOM ELEMENTS ====================
const DOM = {
    // Screens
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),
    
    // Auth
    googleSignInBtn: document.getElementById('googleSignIn'),
    
    // Header
    appHeader: document.getElementById('appHeader'),
    headerTitle: document.getElementById('headerTitle'),
    userAvatar: document.getElementById('userAvatar'),
    searchToggleBtn: document.getElementById('searchToggleBtn'),
    
    // Search
    searchContainer: document.getElementById('searchContainer'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    searchFilters: document.getElementById('searchFilters'),
    searchResults: document.getElementById('searchResults'),
    
    // Navigation
    bottomNav: document.getElementById('bottomNav'),
    navBtns: document.querySelectorAll('.nav-btn'),
    
    // Tabs
    homeTab: document.getElementById('homeTab'),
    libraryTab: document.getElementById('libraryTab'),
    searchTab: document.getElementById('searchTab'),
    profileTab: document.getElementById('profileTab'),
    
    // Home
    smartPlaylists: document.getElementById('smartPlaylists'),
    recentSection: document.getElementById('recentSection'),
    recentSongs: document.getElementById('recentSongs'),
    
    // Library
    sectionBtns: document.querySelectorAll('.section-btn'),
    allSongsView: document.getElementById('allSongsView'),
    playlistsView: document.getElementById('playlistsView'),
    albumsView: document.getElementById('albumsView'),
    artistsView: document.getElementById('artistsView'),
    allSongsList: document.getElementById('allSongsList'),
    playlistGrid: document.getElementById('playlistGrid'),
    albumGrid: document.getElementById('albumGrid'),
    artistGrid: document.getElementById('artistGrid'),
    shuffleAllBtn: document.getElementById('shuffleAllBtn'),
    sortSelect: document.getElementById('sortSelect'),
    createPlaylistBtn: document.getElementById('createPlaylistBtn'),
    
    // Profile
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    statTotalPlays: document.getElementById('statTotalPlays'),
    statListeningTime: document.getElementById('statListeningTime'),
    statFavorites: document.getElementById('statFavorites'),
    statPlaylists: document.getElementById('statPlaylists'),
    themeToggle: document.getElementById('themeToggle'),
    crossfadeToggle: document.getElementById('crossfadeToggle'),
    signOutBtn: document.getElementById('signOutBtn'),
    
    // Player
    audioPlayer: document.getElementById('audioPlayer'),
    miniPlayer: document.getElementById('miniPlayer'),
    fullPlayer: document.getElementById('fullPlayer'),
    
    // Mini Player
    miniPlayerTap: document.getElementById('miniPlayerTap'),
    miniCover: document.getElementById('miniCover'),
    miniTitle: document.getElementById('miniTitle'),
    miniArtist: document.getElementById('miniArtist'),
    miniPlayPauseBtn: document.getElementById('miniPlayPauseBtn'),
    miniPlayIcon: document.getElementById('miniPlayIcon'),
    miniPauseIcon: document.getElementById('miniPauseIcon'),
    miniProgress: document.getElementById('miniProgress'),
    
    // Full Player
    minimizePlayer: document.getElementById('minimizePlayer'),
    fullCover: document.getElementById('fullCover'),
    fullTitle: document.getElementById('fullTitle'),
    fullArtist: document.getElementById('fullArtist'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    progressBar: document.getElementById('progressBar'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    likeBtn: document.getElementById('likeBtn'),
    queueBtn: document.getElementById('queueBtn'),
    
    // Modals
    modalContainer: document.getElementById('modalContainer'),
    toastContainer: document.getElementById('toastContainer')
};

// ==================== INITIALIZATION ====================
async function init() {
    console.log('🎵 Initializing Aurio...');
    
    try {
        // Set auth persistence FIRST (critical for mobile)
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('✅ Auth persistence set to LOCAL');
        
        // Setup auth state listener BEFORE checking redirect
        auth.onAuthStateChanged(onAuthStateChanged);
        
        // Handle OAuth redirect result
        try {
            const result = await auth.getRedirectResult();
            if (result.user) {
                console.log('✅ Signed in via redirect:', result.user.email);
            } else if (result.credential) {
                console.log('✅ Redirect completed with credential');
            }
        } catch (redirectError) {
            console.error('⚠️ Redirect error:', redirectError);
            if (redirectError.code !== 'auth/popup-closed-by-user') {
                handleAuthError(redirectError);
            }
        }
        
    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('Initialization failed. Please refresh.', 'error');
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Register Media Session
    if ('mediaSession' in navigator) {
        setupMediaSession();
    }
    
    // Session health check
    setTimeout(checkAuthHealth, 2000);
    
    console.log('✅ Aurio initialized');
}

// ==================== SESSION RECOVERY ====================
function checkAuthHealth() {
    const maxWaitTime = 10000;
    let resolved = false;
    
    const timeout = setTimeout(() => {
        if (!resolved && !AppState.currentUser) {
            console.warn('⚠️ Auth state not resolved, checking current user...');
            const currentUser = auth.currentUser;
            if (currentUser) {
                console.log('✅ Found cached user, forcing auth state update');
                onAuthStateChanged(currentUser);
            }
        }
    }, maxWaitTime);
    
    const unsubscribe = auth.onAuthStateChanged(() => {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
    });
}

// Visibility change handler
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const currentUser = auth.currentUser;
        if (currentUser && !AppState.currentUser) {
            console.log('🔄 App visible - restoring user session');
            onAuthStateChanged(currentUser);
        }
    }
});

// ==================== AUTHENTICATION ====================
function onAuthStateChanged(user) {
    if (user) {
        AppState.currentUser = user;
        console.log('✅ User:', user.email || user.phoneNumber);
        showApp();
        loadUserData();
        loadSongs();
    } else {
        AppState.currentUser = null;
        showAuth();
    }
}

function showAuth() {
    DOM.authScreen.classList.add('active');
    DOM.appScreen.classList.remove('active');
}

function showApp() {
    DOM.authScreen.classList.remove('active');
    DOM.appScreen.classList.add('active');
    
    // Set user info
    const photoURL = AppState.currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + 
        encodeURIComponent(AppState.currentUser.displayName || AppState.currentUser.email || 'User');
    
    DOM.userAvatar.src = photoURL;
    DOM.profileAvatar.src = photoURL;
    DOM.profileName.textContent = AppState.currentUser.displayName || 'User';
    DOM.profileEmail.textContent = AppState.currentUser.email || AppState.currentUser.phoneNumber || '';
}

async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ 
            prompt: 'select_account',
            hd: '*'
        });
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        console.log('🔐 Signing in...', isMobile ? '(Mobile - Redirect)' : '(Desktop - Popup)');
        
        if (isMobile) {
            // Mobile: Always use redirect
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            await auth.signInWithRedirect(provider);
        } else {
            // Desktop: Try popup, fallback to redirect
            try {
                await auth.signInWithPopup(provider);
            } catch (error) {
                if (error.code === 'auth/popup-blocked' || 
                    error.code === 'auth/popup-closed-by-user') {
                    console.log('Popup blocked/closed, using redirect');
                    await auth.signInWithRedirect(provider);
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error('Google sign in error:', error);
        if (error.code !== 'auth/popup-closed-by-user' && 
            error.code !== 'auth/cancelled-popup-request') {
            handleAuthError(error);
        }
    }
}

function signOut() {
    if (!confirm('Sign out of Aurio?')) return;
    
    auth.signOut()
        .then(() => {
            pauseAudio();
            resetAppState();
            showToast('Signed out successfully');
        })
        .catch(error => {
            console.error('Sign out error:', error);
            showToast('Sign out failed', 'error');
        });
}

function handleAuthError(error) {
    console.error('Auth error:', error);
    
    const errorMessages = {
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/operation-not-allowed': 'Sign in method not enabled.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups.',
        'auth/unauthorized-domain': 'This domain is not authorized.',
        'auth/web-storage-unsupported': 'Your browser doesn\'t support storage. Enable cookies.'
    };
    
    const message = errorMessages[error.code] || `Authentication failed: ${error.message}`;
    showToast(message, 'error');
}

// ==================== DATA LOADING ====================
async function loadUserData() {
    const uid = AppState.currentUser.uid;
    
    try {
        // Load liked songs
        const likedSnapshot = await database.ref(`users/${uid}/likedSongs`).once('value');
        const likedData = likedSnapshot.val();
        if (likedData) {
            AppState.likedSongs = new Set(Object.keys(likedData));
        }
        
        // Load recently played
        const recentSnapshot = await database.ref(`users/${uid}/recentlyPlayed`).once('value');
        const recentData = recentSnapshot.val();
        if (recentData) {
            AppState.recentlyPlayed = Object.values(recentData).sort((a, b) => b.playedAt - a.playedAt);
        }
        
        // Load playlists
        const playlistsSnapshot = await database.ref(`playlists/${uid}`).once('value');
        const playlistsData = playlistsSnapshot.val();
        if (playlistsData) {
            AppState.playlists = Object.entries(playlistsData).map(([id, data]) => ({
                id,
                ...data
            }));
        }
        
        updateStats();
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function loadSongs() {
    showSkeletonLoading();
    
    database.ref('songs').on('value', snapshot => {
        const data = snapshot.val();
        AppState.allSongs = [];
        
        if (data) {
            AppState.allSongs = Object.entries(data).map(([id, song]) => ({
                id,
                ...song
            }));
        }
        
        renderAllSongs();
        renderSmartPlaylists();
        renderRecentlyPlayed();
        updateStats();
        
    }, error => {
        console.error('Error loading songs:', error);
        showToast('Failed to load songs', 'error');
    });
}

// [Include all the rendering, playback, navigation, and utility functions from the original app.js]
// [I'll keep them the same since they work fine]

function renderAllSongs() {
    if (AppState.allSongs.length === 0) {
        DOM.allSongsList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No songs yet</p>
                <p style="font-size:14px; margin-top:8px;">Add songs from admin panel</p>
            </div>
        `;
        return;
    }
    
    const sortedSongs = sortSongs(AppState.allSongs, DOM.sortSelect.value);
    
    DOM.allSongsList.innerHTML = sortedSongs.map((song, index) => `
        <div class="song-item" data-index="${index}" data-song-id="${song.id}">
            <img src="${song.coverUrl || 'https://via.placeholder.com/56'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="song-cover"
                 onerror="this.src='https://via.placeholder.com/56?text=♪'">
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <button class="song-menu-btn" data-song-id="${song.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    DOM.allSongsList.querySelectorAll('.song-item').forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.song-menu-btn')) {
                playSongAtIndex(idx, sortedSongs);
            }
        });
    });
    
    DOM.allSongsList.querySelectorAll('.song-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showSongMenu(btn.dataset.songId);
        });
    });
}

function renderSmartPlaylists() {
    const currentHour = new Date().getHours();
    let timePlaylist = '';
    
    if (currentHour >= 6 && currentHour < 12) {
        timePlaylist = 'Morning Vibes';
    } else if (currentHour >= 12 && currentHour < 18) {
        timePlaylist = 'Afternoon Energy';
    } else if (currentHour >= 18 && currentHour < 22) {
        timePlaylist = 'Evening Chill';
    } else {
        timePlaylist = 'Night Mode';
    }
    
    const playlists = [
        { name: timePlaylist, desc: 'Perfect for right now', icon: '🌅', action: 'time' },
        { name: 'Top 50', desc: 'Your most played songs', icon: '🔥', action: 'top' },
        { name: 'New Additions', desc: 'Recently added tracks', icon: '✨', action: 'new' },
        { name: 'Liked Songs', desc: `${AppState.likedSongs.size} songs`, icon: '❤️', action: 'liked' }
    ];
    
    DOM.smartPlaylists.innerHTML = playlists.map(pl => `
        <div class="smart-playlist-card" data-action="${pl.action}">
            <div class="smart-playlist-icon">${pl.icon}</div>
            <div class="smart-playlist-info">
                <div class="smart-playlist-name">${pl.name}</div>
                <div class="smart-playlist-desc">${pl.desc}</div>
            </div>
        </div>
    `).join('');
    
    DOM.smartPlaylists.querySelectorAll('.smart-playlist-card').forEach(card => {
        card.addEventListener('click', () => {
            handleSmartPlaylist(card.dataset.action);
        });
    });
}

function renderRecentlyPlayed() {
    if (AppState.recentlyPlayed.length === 0) {
        DOM.recentSection.style.display = 'none';
        return;
    }
    
    DOM.recentSection.style.display = 'block';
    const recentSongIds = AppState.recentlyPlayed.slice(0, 10).map(r => r.songId);
    const recentSongs = AppState.allSongs.filter(s => recentSongIds.includes(s.id));
    
    DOM.recentSongs.innerHTML = recentSongs.map(song => `
        <div class="song-item" data-song-id="${song.id}">
            <img src="${song.coverUrl || 'https://via.placeholder.com/56'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="song-cover">
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('');
    
    DOM.recentSongs.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', () => {
            const song = AppState.allSongs.find(s => s.id === item.dataset.songId);
            if (song) playSong(song);
        });
    });
}

function renderPlaylists() {
    if (AppState.playlists.length === 0) {
        DOM.playlistGrid.innerHTML = '<p class="empty-state">No playlists yet</p>';
        return;
    }
    
    DOM.playlistGrid.innerHTML = AppState.playlists.map(playlist => `
        <div class="playlist-card" data-playlist-id="${playlist.id}">
            <div class="playlist-cover"></div>
            <div class="playlist-info">
                <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                <div class="playlist-count">${playlist.songs?.length || 0} songs</div>
            </div>
        </div>
    `).join('');
    
    DOM.playlistGrid.querySelectorAll('.playlist-card').forEach(card => {
        card.addEventListener('click', () => {
            openPlaylist(card.dataset.playlistId);
        });
    });
}

function playSong(song) {
    if (!song) return;
    
    AppState.currentSong = song;
    AppState.currentIndex = AppState.allSongs.findIndex(s => s.id === song.id);
    
    DOM.audioPlayer.src = song.audioUrl;
    DOM.audioPlayer.load();
    
    DOM.audioPlayer.play()
        .then(() => {
            AppState.isPlaying = true;
            updatePlayerUI();
            showMiniPlayer();
            trackPlay(song.id);
            updateMediaSession();
        })
        .catch(error => {
            console.error('Playback error:', error);
            showToast('Failed to play song', 'error');
        });
}

function playSongAtIndex(index, songsList = AppState.allSongs) {
    if (index < 0 || index >= songsList.length) return;
    playSong(songsList[index]);
}

function togglePlayPause() {
    if (!DOM.audioPlayer.src) return;
    
    if (AppState.isPlaying) {
        pauseAudio();
    } else {
        DOM.audioPlayer.play()
            .then(() => {
                AppState.isPlaying = true;
                updatePlayerUI();
            })
            .catch(error => {
                console.error('Play error:', error);
                showToast('Playback failed', 'error');
            });
    }
}

function pauseAudio() {
    DOM.audioPlayer.pause();
    AppState.isPlaying = false;
    updatePlayerUI();
}

function playNext() {
    if (AppState.allSongs.length === 0) return;
    
    let nextIndex;
    if (AppState.shuffle) {
        nextIndex = Math.floor(Math.random() * AppState.allSongs.length);
    } else {
        nextIndex = (AppState.currentIndex + 1) % AppState.allSongs.length;
    }
    playSongAtIndex(nextIndex);
}

function playPrevious() {
    if (AppState.allSongs.length === 0) return;
    
    if (DOM.audioPlayer.currentTime > 3) {
        DOM.audioPlayer.currentTime = 0;
        return;
    }
    
    let prevIndex;
    if (AppState.shuffle) {
        prevIndex = Math.floor(Math.random() * AppState.allSongs.length);
    } else {
        prevIndex = AppState.currentIndex - 1;
        if (prevIndex < 0) prevIndex = AppState.allSongs.length - 1;
    }
    playSongAtIndex(prevIndex);
}

function toggleShuffle() {
    AppState.shuffle = !AppState.shuffle;
    DOM.shuffleBtn.classList.toggle('active', AppState.shuffle);
    showToast(AppState.shuffle ? 'Shuffle on' : 'Shuffle off');
}

function toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(AppState.repeat);
    AppState.repeat = modes[(currentIndex + 1) % modes.length];
    
    DOM.repeatBtn.classList.toggle('active', AppState.repeat !== 'off');
    showToast({ off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' }[AppState.repeat]);
}

function toggleLike() {
    if (!AppState.currentSong) return;
    
    const songId = AppState.currentSong.id;
    const uid = AppState.currentUser.uid;
    
    if (AppState.likedSongs.has(songId)) {
        AppState.likedSongs.delete(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).remove();
        DOM.likeBtn.classList.remove('active');
        showToast('Removed from liked songs');
    } else {
        AppState.likedSongs.add(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).set(true);
        DOM.likeBtn.classList.add('active');
        showToast('Added to liked songs');
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

function updatePlayerUI() {
    if (!AppState.currentSong) return;
    
    const song = AppState.currentSong;
    DOM.miniCover.src = song.coverUrl || 'https://via.placeholder.com/48';
    DOM.miniTitle.textContent = song.title;
    DOM.miniArtist.textContent = song.artist;
    DOM.fullCover.src = song.coverUrl || 'https://via.placeholder.com/400';
    DOM.fullTitle.textContent = song.title;
    DOM.fullArtist.textContent = song.artist;
    
    const showPause = AppState.isPlaying;
    DOM.playIcon.style.display = showPause ? 'none' : 'block';
    DOM.pauseIcon.style.display = showPause ? 'block' : 'none';
    DOM.miniPlayIcon.style.display = showPause ? 'none' : 'block';
    DOM.miniPauseIcon.style.display = showPause ? 'block' : 'none';
    
    DOM.likeBtn.classList.toggle('active', AppState.likedSongs.has(song.id));
    DOM.shuffleBtn.classList.toggle('active', AppState.shuffle);
    DOM.repeatBtn.classList.toggle('active', AppState.repeat !== 'off');
}

function updateProgress() {
    const current = DOM.audioPlayer.currentTime;
    const total = DOM.audioPlayer.duration;
    
    if (isNaN(current) || isNaN(total)) return;
    
    DOM.currentTime.textContent = formatTime(current);
    DOM.duration.textContent = formatTime(total);
    DOM.progressBar.value = (current / total) * 100;
    DOM.miniProgress.style.width = `${(current / total) * 100}%`;
}

function seekAudio(e) {
    const percent = e.target.value;
    const time = (percent / 100) * DOM.audioPlayer.duration;
    DOM.audioPlayer.currentTime = time;
}

function showMiniPlayer() {
    DOM.miniPlayer.classList.remove('hidden');
}

function showFullPlayer() {
    DOM.fullPlayer.classList.remove('hidden');
}

function hideFullPlayer() {
    DOM.fullPlayer.classList.add('hidden');
}

function switchTab(tabName) {
    AppState.currentTab = tabName;
    DOM.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) activeTab.classList.add('active');
    
    DOM.headerTitle.textContent = { home: 'Home', library: 'Library', search: 'Search', profile: 'Profile' }[tabName] || 'Aurio';
    
    if (tabName === 'search') {
        DOM.searchContainer.classList.add('active');
        setTimeout(() => DOM.searchInput.focus(), 100);
    } else {
        DOM.searchContainer.classList.remove('active');
    }
}

function performSearch(query) {
    if (!query.trim()) {
        DOM.searchResults.innerHTML = '';
        return;
    }
    
    const results = AppState.allSongs.filter(song => {
        const searchStr = `${song.title} ${song.artist} ${song.album || ''}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
    });
    
    if (results.length === 0) {
        DOM.searchResults.innerHTML = '<div class="empty-state">No results found</div>';
        return;
    }
    
    DOM.searchResults.innerHTML = `<div class="song-list">${results.map(song => `
        <div class="song-item" data-song-id="${song.id}">
            <img src="${song.coverUrl || 'https://via.placeholder.com/56'}" alt="${escapeHtml(song.title)}" class="song-cover">
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('')}</div>`;
    
    DOM.searchResults.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', () => {
            const song = AppState.allSongs.find(s => s.id === item.dataset.songId);
            if (song) playSong(song);
        });
    });
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sortSongs(songs, sortBy) {
    const sorted = [...songs];
    switch (sortBy) {
        case 'title': return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'artist': return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        case 'plays': return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        case 'recent':
        default: return sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSkeletonLoading() {
    DOM.allSongsList.innerHTML = Array(10).fill(0).map(() => `
        <div class="skeleton-song">
            <div class="skeleton skeleton-cover"></div>
            <div class="skeleton-info">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-artist"></div>
            </div>
        </div>
    `).join('');
}

function trackPlay(songId) {
    database.ref(`songs/${songId}/playCount`).transaction(count => (count || 0) + 1);
    const uid = AppState.currentUser.uid;
    const recentId = Date.now();
    database.ref(`users/${uid}/recentlyPlayed/${recentId}`).set({ songId, playedAt: Date.now() });
}

function updateStats() {
    DOM.statFavorites.textContent = AppState.likedSongs.size;
    DOM.statPlaylists.textContent = AppState.playlists.length;
    
    let totalPlays = 0, totalTime = 0;
    AppState.allSongs.forEach(song => {
        totalPlays += song.playCount || 0;
        totalTime += (song.duration || 180) * (song.playCount || 0);
    });
    
    DOM.statTotalPlays.textContent = totalPlays;
    DOM.statListeningTime.textContent = `${Math.floor(totalTime / 3600)}h`;
}

function setupMediaSession() {
    navigator.mediaSession.setActionHandler('play', () => {
        DOM.audioPlayer.play();
        AppState.isPlaying = true;
        updatePlayerUI();
    });
    navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
}

function updateMediaSession() {
    if (!('mediaSession' in navigator) || !AppState.currentSong) return;
    const song = AppState.currentSong;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'Aurio',
        artwork: [{ src: song.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }]
    });
}

function handleSmartPlaylist(action) {
    let songs = [];
    switch (action) {
        case 'liked': songs = AppState.allSongs.filter(s => AppState.likedSongs.has(s.id)); break;
        case 'top': songs = [...AppState.allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50); break;
        case 'new': songs = [...AppState.allSongs].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 20); break;
        case 'time': songs = AppState.allSongs; break;
    }
    
    if (songs.length > 0) {
        if (AppState.shuffle) {
            playSong(songs[Math.floor(Math.random() * songs.length)]);
        } else {
            playSong(songs[0]);
        }
    }
}

function showSongMenu(songId) {
    showToast('Song menu coming soon!');
}

function resetAppState() {
    AppState.allSongs = [];
    AppState.playlists = [];
    AppState.likedSongs = new Set();
    AppState.recentlyPlayed = [];
    AppState.currentSong = null;
    AppState.currentIndex = -1;
    AppState.isPlaying = false;
}

function openPlaylist(playlistId) {
    // TODO: Implement playlist view
    showToast('Playlist view coming soon!');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Critical: Make sure button exists before adding listener
    if (DOM.googleSignInBtn) {
        DOM.googleSignInBtn.addEventListener('click', signInWithGoogle);
        console.log('✅ Google Sign In button listener attached');
    } else {
        console.error('❌ Google Sign In button not found!');
    }
    
    if (DOM.signOutBtn) DOM.signOutBtn.addEventListener('click', signOut);
    
    // Navigation
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Search
    if (DOM.searchToggleBtn) DOM.searchToggleBtn.addEventListener('click', () => switchTab('search'));
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            DOM.searchClear.style.display = query ? 'block' : 'none';
            performSearch(query);
        });
    }
    if (DOM.searchClear) {
        DOM.searchClear.addEventListener('click', () => {
            DOM.searchInput.value = '';
            DOM.searchClear.style.display = 'none';
            DOM.searchResults.innerHTML = '';
        });
    }
    
    // Library
    DOM.sectionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.sectionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.library-view').forEach(v => v.classList.remove('active'));
            const view = document.getElementById(`${btn.dataset.section}View`);
            if (view) view.classList.add('active');
            if (btn.dataset.section === 'playlists') renderPlaylists();
        });
    });
    
    if (DOM.shuffleAllBtn) {
        DOM.shuffleAllBtn.addEventListener('click', () => {
            if (AppState.allSongs.length > 0) {
                AppState.shuffle = true;
                DOM.shuffleBtn.classList.add('active');
                playSongAtIndex(Math.floor(Math.random() * AppState.allSongs.length));
            }
        });
    }
    
    if (DOM.sortSelect) DOM.sortSelect.addEventListener('change', renderAllSongs);
    if (DOM.createPlaylistBtn) {
        DOM.createPlaylistBtn.addEventListener('click', () => {
            const name = prompt('Playlist name:');
            if (name) {
                const uid = AppState.currentUser.uid;
                const playlistId = Date.now().toString();
                database.ref(`playlists/${uid}/${playlistId}`).set({
                    name, songs: [], createdAt: Date.now()
                }).then(() => showToast('Playlist created!'));
            }
        });
    }
    
    // Settings
    if (DOM.themeToggle) DOM.themeToggle.addEventListener('change', (e) => {
        AppState.settings.theme = e.target.checked ? 'dark' : 'light';
    });
    if (DOM.crossfadeToggle) DOM.crossfadeToggle.addEventListener('change', (e) => {
        AppState.settings.crossfade = e.target.checked;
    });
    
    // Player controls
    if (DOM.miniPlayerTap) DOM.miniPlayerTap.addEventListener('click', showFullPlayer);
    if (DOM.minimizePlayer) DOM.minimizePlayer.addEventListener('click', hideFullPlayer);
    if (DOM.playPauseBtn) DOM.playPauseBtn.addEventListener('click', togglePlayPause);
    if (DOM.miniPlayPauseBtn) DOM.miniPlayPauseBtn.addEventListener('click', togglePlayPause);
    if (DOM.prevBtn) DOM.prevBtn.addEventListener('click', playPrevious);
    if (DOM.nextBtn) DOM.nextBtn.addEventListener('click', playNext);
    if (DOM.shuffleBtn) DOM.shuffleBtn.addEventListener('click', toggleShuffle);
    if (DOM.repeatBtn) DOM.repeatBtn.addEventListener('click', toggleRepeat);
    if (DOM.likeBtn) DOM.likeBtn.addEventListener('click', toggleLike);
    if (DOM.progressBar) DOM.progressBar.addEventListener('input', seekAudio);
    
    // Audio events
    if (DOM.audioPlayer) {
        DOM.audioPlayer.addEventListener('timeupdate', updateProgress);
        DOM.audioPlayer.addEventListener('ended', () => {
            if (AppState.repeat === 'one') {
                DOM.audioPlayer.currentTime = 0;
                DOM.audioPlayer.play();
            } else {
                playNext();
            }
        });
        DOM.audioPlayer.addEventListener('loadedmetadata', () => {
            DOM.duration.textContent = formatTime(DOM.audioPlayer.duration);
            DOM.progressBar.max = 100;
        });
        DOM.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showToast('Failed to load audio', 'error');
        });
    }
    
    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSmartPlaylist(btn.dataset.action));
    });
}

// ==================== START APP ====================
init();
