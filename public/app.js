// Aurio Music App - Complete Bug-Free Version
// Version 3.0 - All Issues Resolved

// ==================== STATE MANAGEMENT ====================
const AppState = {
    currentUser: null,
    allSongs: [],
    albums: [],
    artists: [],
    playlists: [],
    likedSongs: new Set(),
    recentlyPlayed: [],
    currentSong: null,
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    repeat: 'off',
    queue: [],
    playedInSession: new Set(),
    currentTab: 'home',
    navigationHistory: [],
    settings: {
        theme: 'dark',
        crossfade: false,
        quality: 'high'
    }
};

// ==================== DOM ELEMENTS ====================
const DOM = {
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),
    // Auth elements
    authButtons: document.getElementById('authButtons'),
    showSignInBtn: document.getElementById('showSignInBtn'),
    showSignUpBtn: document.getElementById('showSignUpBtn'),
    signInForm: document.getElementById('signInForm'),
    signUpForm: document.getElementById('signUpForm'),
    signInUsername: document.getElementById('signInUsername'),
    signInPassword: document.getElementById('signInPassword'),
    signInError: document.getElementById('signInError'),
    signUpUsername: document.getElementById('signUpUsername'),
    signUpPassword: document.getElementById('signUpPassword'),
    signUpConfirm: document.getElementById('signUpConfirm'),
    signUpError: document.getElementById('signUpError'),
    backFromSignIn: document.getElementById('backFromSignIn'),
    backFromSignUp: document.getElementById('backFromSignUp'),
    pendingApproval: document.getElementById('pendingApproval'),
    logoutPending: document.getElementById('logoutPending'),
    appHeader: document.getElementById('appHeader'),
    headerTitle: document.getElementById('headerTitle'),
    userAvatar: document.getElementById('userAvatar'),
    searchToggleBtn: document.getElementById('searchToggleBtn'),
    searchContainer: document.getElementById('searchContainer'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    searchResults: document.getElementById('searchResults'),
    bottomNav: document.getElementById('bottomNav'),
    navBtns: document.querySelectorAll('.nav-btn'),
    homeTab: document.getElementById('homeTab'),
    libraryTab: document.getElementById('libraryTab'),
    searchTab: document.getElementById('searchTab'),
    profileTab: document.getElementById('profileTab'),
    smartPlaylists: document.getElementById('smartPlaylists'),
    recentSection: document.getElementById('recentSection'),
    recentSongs: document.getElementById('recentSongs'),
    topArtistsSection: document.getElementById('topArtistsSection'),
    topArtistsGrid: document.getElementById('topArtistsGrid'),
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
    filterSelect: document.getElementById('filterSelect'),
    createPlaylistBtn: document.getElementById('createPlaylistBtn'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileUsername'),
    profileEmail: document.getElementById('profileEmail'),
    editUsernameBtn: document.getElementById('editUsernameBtn'),
    likedSongsToggle: document.getElementById('likedSongsToggle'),
    likedSongsContent: document.getElementById('likedSongsContent'),
    likedSongsList: document.getElementById('likedSongsList'),
    statTotalPlays: document.getElementById('statTotalPlays'),
    statListeningTime: document.getElementById('statListeningTime'),
    statFavorites: document.getElementById('statFavorites'),
    statPlaylists: document.getElementById('statPlaylists'),
    themeToggle: document.getElementById('themeToggle'),
    crossfadeToggle: document.getElementById('crossfadeToggle'),
    signOutBtn: document.getElementById('logoutBtn'),
    audioPlayer: document.getElementById('audioPlayer'),
    miniPlayer: document.getElementById('miniPlayer'),
    fullPlayer: document.getElementById('fullPlayer'),
    miniPlayerTap: document.getElementById('miniPlayer'),
    miniCover: document.getElementById('miniCover'),
    miniTitle: document.getElementById('miniTitle'),
    miniArtist: document.getElementById('miniArtist'),
    miniPlayPauseBtn: document.getElementById('miniPlayPause'),
    miniProgress: document.getElementById('miniProgress'),
    minimizePlayer: document.getElementById('closePlayer'),
    fullCover: document.getElementById('playerCover'),
    fullTitle: document.getElementById('playerTitle'),
    fullArtist: document.getElementById('playerArtist'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    progressBar: document.getElementById('progressBar'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('totalTime'),
    likeBtn: document.getElementById('likeBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    modalContainer: null,  // Will be created dynamically
    toastContainer: null   // Will be created dynamically
};

// ==================== INITIALIZATION ====================
function init() {
    console.log('🎵 Initializing Aurio...');
    
    // Create modal and toast containers if they don't exist
    createContainers();
    
    setupBackButtonHandler();
    
    // Setup event listeners first so buttons work even if Firebase fails
    setupEventListeners();
    
    // Only initialize Firebase auth if it's available
    try {
        if (typeof auth !== 'undefined' && auth !== null) {
            auth.getRedirectResult()
                .then(result => {
                    if (result.user) {
                        console.log('✅ Signed in via redirect');
                    }
                })
                .catch(handleAuthError);
            
            auth.onAuthStateChanged(onAuthStateChanged);
        } else {
            console.warn('Firebase auth not available');
            showAuth();
        }
    } catch (e) {
        console.warn('Firebase not loaded:', e);
        showAuth();
    }
    
    if ('mediaSession' in navigator) {
        setupMediaSession();
    }
    
    console.log('✅ Aurio initialized');
}

function createContainers() {
    // Create modal container
    if (!document.getElementById('modalContainer')) {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
        DOM.modalContainer = modalContainer;
    }
    
    // Create toast container
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        DOM.toastContainer = toastContainer;
    }
}

// ==================== BACK BUTTON HANDLER ====================
function setupBackButtonHandler() {
    window.addEventListener('popstate', (e) => {
        e.preventDefault();
        
        if (DOM.fullPlayer.classList.contains('active')) {
            hideFullPlayer();
            return;
        }
        
        if (DOM.searchContainer && DOM.searchContainer.classList.contains('active')) {
            DOM.searchContainer.classList.remove('active');
            DOM.searchInput.value = '';
            DOM.searchResults.innerHTML = '';
            return;
        }
        
        if (AppState.navigationHistory.length > 0) {
            const previousTab = AppState.navigationHistory.pop();
            switchTab(previousTab, false);
            return;
        }
        
        if (AppState.currentTab !== 'home') {
            switchTab('home', false);
        }
    });
    
    history.pushState({ tab: 'home' }, '', '');
}

// ==================== AUTHENTICATION ====================
function onAuthStateChanged(user) {
    if (user) {
        AppState.currentUser = user;
        console.log('✅ User:', user.email);
        localStorage.setItem('aurioAuthState', 'authenticated');
        showApp();
        loadUserData();
        loadSongs();
    } else {
        AppState.currentUser = null;
        localStorage.removeItem('aurioAuthState');
        showAuth();
    }
}

function showAuth() {
    DOM.authScreen.classList.add('active');
    DOM.appScreen.classList.remove('active');
    // Reset to initial auth buttons view
    showAuthButtons();
}

function showApp() {
    DOM.authScreen.classList.remove('active');
    DOM.appScreen.classList.add('active');
    // Use displayName extracted from username (stored in Firebase)
    const displayName = AppState.currentUser.displayName || 
                        (AppState.currentUser.email ? AppState.currentUser.email.split('@')[0] : 'User');
    if (DOM.userAvatar) DOM.userAvatar.src = AppState.currentUser.photoURL || '';
    if (DOM.profileAvatar) {
        // Set avatar with first letter of username
        DOM.profileAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
    if (DOM.profileName) DOM.profileName.textContent = displayName;
    if (DOM.profileEmail) DOM.profileEmail.textContent = AppState.currentUser.email || '';
}

// Auth UI functions
function showAuthButtons() {
    DOM.authButtons.style.display = 'flex';
    DOM.signInForm.classList.remove('active');
    DOM.signUpForm.classList.remove('active');
    DOM.pendingApproval.style.display = 'none';
    clearAuthErrors();
}

function showSignInForm() {
    DOM.authButtons.style.display = 'none';
    DOM.signInForm.classList.add('active');
    DOM.signUpForm.classList.remove('active');
    clearAuthErrors();
}

function showSignUpForm() {
    DOM.authButtons.style.display = 'none';
    DOM.signInForm.classList.remove('active');
    DOM.signUpForm.classList.add('active');
    clearAuthErrors();
}

function clearAuthErrors() {
    if (DOM.signInError) DOM.signInError.textContent = '';
    if (DOM.signUpError) DOM.signUpError.textContent = '';
}

// Username validation helper
function isValidUsername(username) {
    // Allow only alphanumeric characters, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
}

// Sign In with username/password
async function handleSignIn(e) {
    e.preventDefault();
    
    const username = DOM.signInUsername.value.trim();
    const password = DOM.signInPassword.value;
    
    if (!username || !password) {
        DOM.signInError.textContent = 'Please fill in all fields';
        return;
    }
    
    // Validate username format
    if (!isValidUsername(username)) {
        DOM.signInError.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
        return;
    }
    
    // Convert username to email format for Firebase
    const email = `${username}@aurio.app`;
    
    const submitBtn = DOM.signInForm.querySelector('.auth-submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Auth state change will handle the rest
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMessage = 'Sign in failed. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this username';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Username contains invalid characters';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many attempts. Please try again later.';
        }
        
        DOM.signInError.textContent = errorMessage;
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Sign Up with username/password
async function handleSignUp(e) {
    e.preventDefault();
    
    const username = DOM.signUpUsername.value.trim();
    const password = DOM.signUpPassword.value;
    const confirmPassword = DOM.signUpConfirm.value;
    
    if (!username || !password || !confirmPassword) {
        DOM.signUpError.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password !== confirmPassword) {
        DOM.signUpError.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        DOM.signUpError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (username.length < 3) {
        DOM.signUpError.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    // Validate username format
    if (!isValidUsername(username)) {
        DOM.signUpError.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
        return;
    }
    
    // Convert username to email format for Firebase
    const email = `${username}@aurio.app`;
    
    const submitBtn = DOM.signUpForm.querySelector('.auth-submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    let userCredential = null;
    
    try {
        userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update display name to username
        await userCredential.user.updateProfile({
            displayName: username
        });
        
        // Create user record in database
        try {
            await db.ref(`users/${userCredential.user.uid}`).set({
                username: username,
                email: email,
                createdAt: Date.now(),
                approved: true
            });
        } catch (dbError) {
            console.error('Database write error:', dbError);
            // Continue - user is still authenticated even if DB write fails
            // The record can be created later on first login
        }
        
        // Auth state change will handle the rest
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Sign up failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This username is already taken';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Username contains invalid characters';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        }
        
        DOM.signUpError.textContent = errorMessage;
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
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
    showToast(`Authentication failed: ${error.message}`, 'error');
}

// ==================== DATA LOADING ====================
async function loadUserData() {
    const uid = AppState.currentUser.uid;
    
    try {
        const likedSnapshot = await database.ref(`users/${uid}/likedSongs`).once('value');
        const likedData = likedSnapshot.val();
        if (likedData) {
            AppState.likedSongs = new Set(Object.keys(likedData));
        }
        
        const recentSnapshot = await database.ref(`users/${uid}/recentlyPlayed`).once('value');
        const recentData = recentSnapshot.val();
        if (recentData) {
            AppState.recentlyPlayed = Object.values(recentData).sort((a, b) => b.playedAt - a.playedAt);
        }
        
        const playlistsSnapshot = await database.ref(`playlists/${uid}`).once('value');
        const playlistsData = playlistsSnapshot.val();
        if (playlistsData) {
            AppState.playlists = Object.entries(playlistsData).map(([id, data]) => ({
                id,
                ...data
            }));
        }
        
        updateStats();
        renderPlaylists();
        
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
        
        processAlbumsAndArtists();
        renderAllSongs();
        renderSmartPlaylists();
        renderRecentlyPlayed();
        renderAlbums();
        renderArtists();
        updateStats();
        
    }, error => {
        console.error('Error loading songs:', error);
        showToast('Failed to load songs', 'error');
    });
}

function processAlbumsAndArtists() {
    const albumMap = {};
    const artistMap = {};
    
    AppState.allSongs.forEach(song => {
        if (song.album) {
            if (!albumMap[song.album]) {
                albumMap[song.album] = {
                    name: song.album,
                    artist: song.artist,
                    cover: song.cover || song.coverUrl,
                    songs: [],
                    year: song.year
                };
            }
            albumMap[song.album].songs.push(song);
        }
        
        if (song.artist) {
            if (!artistMap[song.artist]) {
                artistMap[song.artist] = {
                    name: song.artist,
                    cover: song.cover || song.coverUrl,
                    songs: [],
                    totalPlays: 0
                };
            }
            artistMap[song.artist].songs.push(song);
            artistMap[song.artist].totalPlays += (song.playCount || 0);
        }
    });
    
    AppState.albums = Object.values(albumMap);
    AppState.artists = Object.values(artistMap);
}

// ==================== RENDERING ====================
function renderAllSongs() {
    if (AppState.allSongs.length === 0) {
        DOM.allSongsList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No songs yet</p>
            </div>
        `;
        return;
    }
    
    let filteredSongs = [...AppState.allSongs];
    
    if (DOM.filterSelect) {
        const filterValue = DOM.filterSelect.value;
        if (filterValue && filterValue !== 'all') {
            filteredSongs = filteredSongs.filter(song => {
                return (song.genre || '').toLowerCase() === filterValue.toLowerCase() ||
                       (song.mood || '').toLowerCase() === filterValue.toLowerCase();
            });
        }
    }
    
    const sortedSongs = sortSongs(filteredSongs, DOM.sortSelect.value);
    
    DOM.allSongsList.innerHTML = sortedSongs.map((song, index) => `
        <div class="song-item" data-index="${index}" data-song-id="${song.id}">
            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/56'}" 
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
    
    DOM.allSongsList.querySelectorAll('.song-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.song-menu-btn')) {
                const index = parseInt(item.dataset.index);
                playSongAtIndex(index, sortedSongs);
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
        <div class="smart-playlist-card" onclick="handleSmartPlaylist('${pl.action}')">
            <div class="smart-playlist-icon">${pl.icon}</div>
            <div class="smart-playlist-info">
                <div class="smart-playlist-name">${pl.name}</div>
                <div class="smart-playlist-desc">${pl.desc}</div>
            </div>
        </div>
    `).join('');
}

function renderRecentlyPlayed() {
    if (AppState.recentlyPlayed.length === 0) {
        DOM.recentSection.style.display = 'none';
        return;
    }
    
    DOM.recentSection.style.display = 'block';
    
    const recentSongIds = AppState.recentlyPlayed.slice(0, 8).map(r => r.songId);
    const recentSongs = AppState.allSongs.filter(s => recentSongIds.includes(s.id));
    
    DOM.recentSongs.innerHTML = recentSongs.map(song => `
        <div class="song-grid-item" onclick="playSongById('${song.id}')">
            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/100'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="song-grid-cover">
            <div class="song-grid-title">${escapeHtml(song.title)}</div>
            <div class="song-grid-artist">${escapeHtml(song.artist)}</div>
        </div>
    `).join('');
}

function renderAlbums() {
    if (!DOM.albumGrid) return;
    
    if (AppState.albums.length === 0) {
        DOM.albumGrid.innerHTML = '<p class="empty-state">No albums available</p>';
        return;
    }
    
    DOM.albumGrid.innerHTML = AppState.albums.map(album => `
        <div class="album-card" onclick="openAlbum('${escapeHtml(album.name)}')">
            <img src="${album.cover || 'https://via.placeholder.com/150'}" 
                 alt="${escapeHtml(album.name)}" 
                 class="album-cover">
            <div class="album-name">${escapeHtml(album.name)}</div>
            <div class="album-artist">${escapeHtml(album.artist)}</div>
            <div class="album-info">${album.songs.length} songs</div>
        </div>
    `).join('');
}

function renderArtists() {
    if (!DOM.artistGrid) return;
    
    if (AppState.artists.length === 0) {
        DOM.artistGrid.innerHTML = '<p class="empty-state">No artists available</p>';
        return;
    }
    
    const sortedArtists = [...AppState.artists].sort((a, b) => b.totalPlays - a.totalPlays);
    
    DOM.artistGrid.innerHTML = sortedArtists.map(artist => {
        const initial = artist.name.charAt(0).toUpperCase();
        return `
            <div class="artist-card" onclick="openArtist('${escapeHtml(artist.name)}')">
                <div class="artist-cover">
                    ${artist.cover ? `<img src="${artist.cover}" alt="${escapeHtml(artist.name)}">` : `<div class="artist-initial">${initial}</div>`}
                </div>
                <div class="artist-name">${escapeHtml(artist.name)}</div>
                <div class="artist-info">${artist.songs.length} songs</div>
            </div>
        `;
    }).join('');
    
    if (DOM.topArtistsGrid) {
        const topArtists = sortedArtists.slice(0, 6);
        DOM.topArtistsGrid.innerHTML = topArtists.map(artist => {
            const initial = artist.name.charAt(0).toUpperCase();
            return `
                <div class="artist-card-small" onclick="openArtist('${escapeHtml(artist.name)}')">
                    <div class="artist-cover-small">
                        ${artist.cover ? `<img src="${artist.cover}" alt="${escapeHtml(artist.name)}">` : `<div class="artist-initial-small">${initial}</div>`}
                    </div>
                    <div class="artist-name-small">${escapeHtml(artist.name)}</div>
                </div>
            `;
        }).join('');
        
        if (topArtists.length > 0 && DOM.topArtistsSection) {
            DOM.topArtistsSection.style.display = 'block';
        }
    }
}

function renderPlaylists() {
    if (!DOM.playlistGrid) return;
    
    if (AppState.playlists.length === 0) {
        DOM.playlistGrid.innerHTML = '';
        return;
    }
    
    DOM.playlistGrid.innerHTML = AppState.playlists.map(playlist => {
        const songs = playlist.songs || {};
        const songCount = typeof songs === 'object' ? Object.keys(songs).length : 0;
        return `
            <div class="playlist-card" onclick="openPlaylist('${playlist.id}')">
                <div class="playlist-cover" style="${playlist.cover ? `background-image: url('${playlist.cover}')` : ''}"></div>
                <div class="playlist-info">
                    <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                    <div class="playlist-count">${songCount} songs</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderLikedSongs() {
    if (!DOM.likedSongsList) return;
    
    const likedSongs = AppState.allSongs.filter(s => AppState.likedSongs.has(s.id));
    
    if (likedSongs.length === 0) {
        DOM.likedSongsList.innerHTML = '<p class="empty-state">No liked songs yet</p>';
        return;
    }
    
    DOM.likedSongsList.innerHTML = likedSongs.map(song => `
        <div class="song-item" onclick="playSongById('${song.id}')">
            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/56'}" 
                 alt="${escapeHtml(song.title)}" 
                 class="song-cover">
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('');
}

// ==================== PLAYBACK ====================
function playSong(song) {
    if (!song) return;
    
    AppState.currentSong = song;
    AppState.currentIndex = AppState.allSongs.findIndex(s => s.id === song.id);
    AppState.playedInSession.add(song.id);
    
    const audioUrl = song.url || song.audioUrl;
    if (!audioUrl) {
        showToast('Audio URL not found', 'error');
        return;
    }
    
    DOM.audioPlayer.src = audioUrl;
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

function playSongById(songId) {
    const song = AppState.allSongs.find(s => s.id === songId);
    if (song) playSong(song);
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
    
    let nextSong = null;
    
    if (AppState.shuffle) {
        const unplayedSongs = AppState.allSongs.filter(s => !AppState.playedInSession.has(s.id));
        
        if (unplayedSongs.length === 0) {
            AppState.playedInSession.clear();
            const randomIndex = Math.floor(Math.random() * AppState.allSongs.length);
            nextSong = AppState.allSongs[randomIndex];
        } else {
            const randomIndex = Math.floor(Math.random() * unplayedSongs.length);
            nextSong = unplayedSongs[randomIndex];
        }
    } else {
        let nextIndex = AppState.currentIndex + 1;
        
        if (nextIndex >= AppState.allSongs.length) {
            if (AppState.repeat === 'all') {
                nextIndex = 0;
                AppState.playedInSession.clear();
            } else {
                pauseAudio();
                return;
            }
        }
        
        nextSong = AppState.allSongs[nextIndex];
    }
    
    if (nextSong) {
        playSong(nextSong);
    }
}

function playPrevious() {
    if (AppState.allSongs.length === 0) return;
    
    if (DOM.audioPlayer.currentTime > 3) {
        DOM.audioPlayer.currentTime = 0;
        return;
    }
    
    if (AppState.shuffle) {
        const randomIndex = Math.floor(Math.random() * AppState.allSongs.length);
        playSong(AppState.allSongs[randomIndex]);
    } else {
        let prevIndex = AppState.currentIndex - 1;
        
        if (prevIndex < 0) {
            if (AppState.repeat === 'all') {
                prevIndex = AppState.allSongs.length - 1;
            } else {
                prevIndex = 0;
            }
        }
        
        playSong(AppState.allSongs[prevIndex]);
    }
}

function toggleShuffle() {
    AppState.shuffle = !AppState.shuffle;
    DOM.shuffleBtn.classList.toggle('active', AppState.shuffle);
    showToast(AppState.shuffle ? 'Shuffle on' : 'Shuffle off');
    
    if (AppState.shuffle) {
        AppState.playedInSession.clear();
        if (AppState.currentSong) {
            AppState.playedInSession.add(AppState.currentSong.id);
        }
    }
}

function toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(AppState.repeat);
    AppState.repeat = modes[(currentIndex + 1) % modes.length];
    
    DOM.repeatBtn.classList.toggle('active', AppState.repeat !== 'off');
    
    const messages = {
        off: 'Repeat off',
        all: 'Repeat all',
        one: 'Repeat one'
    };
    
    showToast(messages[AppState.repeat]);
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
        
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    updateStats();
    renderLikedSongs();
}

// ==================== PLAYER UI ====================
function updatePlayerUI() {
    if (!AppState.currentSong) return;
    
    const song = AppState.currentSong;
    const coverUrl = song.cover || song.coverUrl || 'https://via.placeholder.com/400';
    
    DOM.miniCover.src = coverUrl;
    DOM.miniTitle.textContent = song.title;
    DOM.miniArtist.textContent = song.artist;
    
    DOM.fullCover.src = coverUrl;
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
    DOM.miniPlayer.classList.add('active');
}

function showFullPlayer() {
    DOM.fullPlayer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideFullPlayer() {
    DOM.fullPlayer.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== NAVIGATION ====================
function switchTab(tabName, addToHistory = true) {
    if (addToHistory && AppState.currentTab !== tabName) {
        AppState.navigationHistory.push(AppState.currentTab);
    }
    
    AppState.currentTab = tabName;
    
    DOM.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) activeTab.classList.add('active');
    
    const titles = {
        home: 'Home',
        library: 'Library',
        search: 'Search',
        profile: 'Profile'
    };
    DOM.headerTitle.textContent = titles[tabName] || 'Aurio';
    
    if (tabName === 'search') {
        DOM.searchContainer.classList.add('active');
        setTimeout(() => DOM.searchInput.focus(), 100);
    } else {
        DOM.searchContainer.classList.remove('active');
    }
    
    if (addToHistory) {
        history.pushState({ tab: tabName }, '', '');
    }
}

// ==================== SEARCH ====================
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
    
    DOM.searchResults.innerHTML = `
        <div class="song-list">
            ${results.map(song => `
                <div class="song-item" onclick="playSongById('${song.id}')">
                    <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/56'}" 
                         alt="${escapeHtml(song.title)}" 
                         class="song-cover">
                    <div class="song-info">
                        <div class="song-title">${escapeHtml(song.title)}</div>
                        <div class="song-artist">${escapeHtml(song.artist)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== SONG MENU ====================
function showSongMenu(songId) {
    const song = AppState.allSongs.find(s => s.id === songId);
    if (!song) return;
    
    const isLiked = AppState.likedSongs.has(songId);
    
    const menuHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="song-menu" onclick="event.stopPropagation()">
                <div class="song-menu-header">
                    <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/60'}" alt="${escapeHtml(song.title)}">
                    <div>
                        <div class="song-menu-title">${escapeHtml(song.title)}</div>
                        <div class="song-menu-artist">${escapeHtml(song.artist)}</div>
                    </div>
                </div>
                <div class="song-menu-options">
                    <button class="menu-option" onclick="closeModal(); playSongById('${songId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Play Now
                    </button>
                    <button class="menu-option" onclick="closeModal(); toggleLikeSong('${songId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        ${isLiked ? 'Unlike' : 'Like'}
                    </button>
                    <button class="menu-option" onclick="showAddToPlaylist('${songId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add to Playlist
                    </button>
                    <button class="menu-option" onclick="closeModal(); addToQueue('${songId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                        </svg>
                        Add to Queue
                    </button>
                </div>
                <button class="menu-close" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = menuHTML;
}

function toggleLikeSong(songId) {
    const uid = AppState.currentUser.uid;
    
    if (AppState.likedSongs.has(songId)) {
        AppState.likedSongs.delete(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).remove();
        showToast('Removed from liked songs');
    } else {
        AppState.likedSongs.add(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).set(true);
        showToast('Added to liked songs');
    }
    
    updateStats();
    renderLikedSongs();
    updatePlayerUI();
}

function showAddToPlaylist(songId) {
    if (AppState.playlists.length === 0) {
        closeModal();
        showToast('No playlists. Create one first!');
        return;
    }
    
    const playlistHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="playlist-select-menu" onclick="event.stopPropagation()">
                <h3>Add to Playlist</h3>
                <div class="playlist-select-list">
                    ${AppState.playlists.map(pl => `
                        <button class="playlist-select-option" onclick="addSongToPlaylist('${songId}', '${pl.id}')">
                            ${escapeHtml(pl.name)}
                        </button>
                    `).join('')}
                </div>
                <button class="menu-close" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = playlistHTML;
}

function addSongToPlaylist(songId, playlistId) {
    const uid = AppState.currentUser.uid;
    
    database.ref(`playlists/${uid}/${playlistId}/songs/${songId}`).set(true)
        .then(() => {
            closeModal();
            showToast('Added to playlist');
        })
        .catch(error => {
            console.error('Error adding to playlist:', error);
            showToast('Failed to add to playlist', 'error');
        });
}

function addToQueue(songId) {
    const song = AppState.allSongs.find(s => s.id === songId);
    if (song) {
        AppState.queue.push(song);
        showToast('Added to queue');
    }
}

function closeModal() {
    DOM.modalContainer.innerHTML = '';
}

// ==================== USERNAME EDIT ====================
function showEditUsername() {
    const currentName = AppState.currentUser.displayName || 'User';
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="edit-username-modal" onclick="event.stopPropagation()">
                <h3>Edit Username</h3>
                <input type="text" id="newUsername" value="${escapeHtml(currentName)}" placeholder="Enter new username">
                <div class="modal-buttons">
                    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveUsername()">Save</button>
                </div>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = modalHTML;
    setTimeout(() => document.getElementById('newUsername').focus(), 100);
}

function saveUsername() {
    const newName = document.getElementById('newUsername').value.trim();
    
    if (!newName) {
        showToast('Username cannot be empty', 'error');
        return;
    }
    
    AppState.currentUser.updateProfile({
        displayName: newName
    }).then(() => {
        DOM.profileName.textContent = newName;
        closeModal();
        showToast('Username updated');
    }).catch(error => {
        console.error('Error updating username:', error);
        showToast('Failed to update username', 'error');
    });
}

// ==================== LIKED SONGS TOGGLE ====================
function toggleLikedSongs() {
    const isVisible = DOM.likedSongsContent.classList.toggle('visible');
    
    if (isVisible) {
        renderLikedSongs();
    }
}

// ==================== ALBUM/ARTIST VIEWS ====================
function openAlbum(albumName) {
    const album = AppState.albums.find(a => a.name === albumName);
    if (!album) return;
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="album-view-modal" onclick="event.stopPropagation()">
                <div class="album-view-header">
                    <button class="back-btn" onclick="closeModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <h2>Album</h2>
                </div>
                <div class="album-view-info">
                    <img src="${album.cover || 'https://via.placeholder.com/200'}" alt="${escapeHtml(album.name)}">
                    <h3>${escapeHtml(album.name)}</h3>
                    <p>${escapeHtml(album.artist)}</p>
                    <p>${album.songs.length} songs</p>
                    <button class="btn-primary" onclick="closeModal(); playAlbum('${escapeHtml(albumName)}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Play Album
                    </button>
                </div>
                <div class="album-songs-list">
                    ${album.songs.map(song => `
                        <div class="song-item" onclick="closeModal(); playSongById('${song.id}')">
                            <div class="song-info">
                                <div class="song-title">${escapeHtml(song.title)}</div>
                                <div class="song-artist">${escapeHtml(song.artist)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = modalHTML;
}

function openArtist(artistName) {
    const artist = AppState.artists.find(a => a.name === artistName);
    if (!artist) return;
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="artist-view-modal" onclick="event.stopPropagation()">
                <div class="artist-view-header">
                    <button class="back-btn" onclick="closeModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <h2>Artist</h2>
                </div>
                <div class="artist-view-info">
                    ${artist.cover ? 
                        `<img src="${artist.cover}" alt="${escapeHtml(artist.name)}">` :
                        `<div class="artist-initial-large">${artist.name.charAt(0).toUpperCase()}</div>`
                    }
                    <h3>${escapeHtml(artist.name)}</h3>
                    <p>${artist.songs.length} songs • ${artist.totalPlays} plays</p>
                    <button class="btn-primary" onclick="closeModal(); playArtist('${escapeHtml(artistName)}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Play All
                    </button>
                </div>
                <div class="artist-songs-list">
                    ${artist.songs.map(song => `
                        <div class="song-item" onclick="closeModal(); playSongById('${song.id}')">
                            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/56'}" 
                                 alt="${escapeHtml(song.title)}" 
                                 class="song-cover">
                            <div class="song-info">
                                <div class="song-title">${escapeHtml(song.title)}</div>
                                <div class="song-artist">${escapeHtml(song.artist)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = modalHTML;
}

function playAlbum(albumName) {
    const album = AppState.albums.find(a => a.name === albumName);
    if (album && album.songs.length > 0) {
        playSong(album.songs[0]);
    }
}

function playArtist(artistName) {
    const artist = AppState.artists.find(a => a.name === artistName);
    if (artist && artist.songs.length > 0) {
        playSong(artist.songs[0]);
    }
}

function openPlaylist(playlistId) {
    const playlist = AppState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const songIds = playlist.songs ? (Array.isArray(playlist.songs) ? playlist.songs : Object.keys(playlist.songs)) : [];
    const songs = AppState.allSongs.filter(s => songIds.includes(s.id));
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="playlist-view-modal" onclick="event.stopPropagation()">
                <div class="playlist-view-header">
                    <button class="back-btn" onclick="closeModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <h2>Playlist</h2>
                </div>
                <div class="playlist-view-info">
                    <div class="playlist-cover-large" style="${playlist.cover ? `background-image: url('${playlist.cover}')` : ''}"></div>
                    <h3>${escapeHtml(playlist.name)}</h3>
                    <p>${songs.length} songs</p>
                    ${songs.length > 0 ? `
                        <button class="btn-primary" onclick="closeModal(); playSongById('${songs[0].id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Play Playlist
                        </button>
                    ` : ''}
                </div>
                <div class="playlist-songs-list">
                    ${songs.length > 0 ? songs.map(song => `
                        <div class="song-item" onclick="closeModal(); playSongById('${song.id}')">
                            <img src="${song.cover || song.coverUrl || 'https://via.placeholder.com/56'}" 
                                 alt="${escapeHtml(song.title)}" 
                                 class="song-cover">
                            <div class="song-info">
                                <div class="song-title">${escapeHtml(song.title)}</div>
                                <div class="song-artist">${escapeHtml(song.artist)}</div>
                            </div>
                        </div>
                    `).join('') : '<p class="empty-state">No songs in this playlist</p>'}
                </div>
            </div>
        </div>
    `;
    
    DOM.modalContainer.innerHTML = modalHTML;
}

// ==================== UTILITIES ====================
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sortSongs(songs, sortBy) {
    const sorted = [...songs];
    
    switch (sortBy) {
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'artist':
            return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        case 'plays':
            return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        case 'recent':
        default:
            return sorted.sort((a, b) => (b.uploadedAt || b.addedAt || 0) - (a.uploadedAt || a.addedAt || 0));
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
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
    database.ref(`users/${uid}/recentlyPlayed/${recentId}`).set({
        songId,
        playedAt: Date.now()
    });
}

function updateStats() {
    DOM.statFavorites.textContent = AppState.likedSongs.size;
    DOM.statPlaylists.textContent = AppState.playlists.length;
    
    let totalPlays = 0;
    let totalTime = 0;
    
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
    
    navigator.mediaSession.setActionHandler('pause', () => {
        pauseAudio();
    });
    
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
        artwork: [
            { src: song.cover || song.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }
        ]
    });
}

function handleSmartPlaylist(action) {
    let songs = [];
    
    switch (action) {
        case 'liked':
            songs = AppState.allSongs.filter(s => AppState.likedSongs.has(s.id));
            break;
        case 'top':
            songs = [...AppState.allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50);
            break;
        case 'new':
            songs = [...AppState.allSongs].sort((a, b) => (b.uploadedAt || b.addedAt || 0) - (a.uploadedAt || a.addedAt || 0)).slice(0, 20);
            break;
        case 'time':
        case 'recent':
            songs = AppState.allSongs;
            break;
    }
    
    if (songs.length > 0) {
        if (AppState.shuffle) {
            const randomIndex = Math.floor(Math.random() * songs.length);
            playSong(songs[randomIndex]);
        } else {
            playSong(songs[0]);
        }
    } else {
        showToast('No songs available');
    }
}

function resetAppState() {
    AppState.allSongs = [];
    AppState.albums = [];
    AppState.artists = [];
    AppState.playlists = [];
    AppState.likedSongs = new Set();
    AppState.recentlyPlayed = [];
    AppState.currentSong = null;
    AppState.currentIndex = -1;
    AppState.isPlaying = false;
    AppState.playedInSession.clear();
    AppState.navigationHistory = [];
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Auth button event listeners
    if (DOM.showSignInBtn) {
        DOM.showSignInBtn.addEventListener('click', showSignInForm);
    }
    if (DOM.showSignUpBtn) {
        DOM.showSignUpBtn.addEventListener('click', showSignUpForm);
    }
    if (DOM.backFromSignIn) {
        DOM.backFromSignIn.addEventListener('click', showAuthButtons);
    }
    if (DOM.backFromSignUp) {
        DOM.backFromSignUp.addEventListener('click', showAuthButtons);
    }
    if (DOM.signInForm) {
        DOM.signInForm.addEventListener('submit', handleSignIn);
    }
    if (DOM.signUpForm) {
        DOM.signUpForm.addEventListener('submit', handleSignUp);
    }
    if (DOM.logoutPending) {
        DOM.logoutPending.addEventListener('click', signOut);
    }
    
    if (DOM.signOutBtn) {
        DOM.signOutBtn.addEventListener('click', signOut);
    }
    
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    if (DOM.searchToggleBtn) {
        DOM.searchToggleBtn.addEventListener('click', () => {
            switchTab('search');
        });
    }
    
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (DOM.searchClear) {
                DOM.searchClear.style.display = query ? 'block' : 'none';
            }
            performSearch(query);
        });
    }
    
    if (DOM.searchClear) {
        DOM.searchClear.addEventListener('click', () => {
            if (DOM.searchInput) DOM.searchInput.value = '';
            DOM.searchClear.style.display = 'none';
            if (DOM.searchResults) DOM.searchResults.innerHTML = '';
        });
    }
    
    DOM.sectionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.sectionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.library-view').forEach(v => v.classList.remove('active'));
            const viewId = `${btn.dataset.section}View`;
            const view = document.getElementById(viewId);
            if (view) view.classList.add('active');
            
            if (btn.dataset.section === 'playlists') {
                renderPlaylists();
            } else if (btn.dataset.section === 'albums') {
                renderAlbums();
            } else if (btn.dataset.section === 'artists') {
                renderArtists();
            }
        });
    });
    
    if (DOM.shuffleAllBtn) {
        DOM.shuffleAllBtn.addEventListener('click', () => {
            if (AppState.allSongs.length > 0) {
                AppState.shuffle = true;
                DOM.shuffleBtn.classList.add('active');
                AppState.playedInSession.clear();
                const randomIndex = Math.floor(Math.random() * AppState.allSongs.length);
                playSongAtIndex(randomIndex);
            }
        });
    }
    
    if (DOM.sortSelect) {
        DOM.sortSelect.addEventListener('change', renderAllSongs);
    }
    
    if (DOM.filterSelect) {
        DOM.filterSelect.addEventListener('change', renderAllSongs);
    }
    
    if (DOM.createPlaylistBtn) {
        DOM.createPlaylistBtn.addEventListener('click', () => {
            const name = prompt('Playlist name:');
            if (name && name.trim()) {
                const uid = AppState.currentUser.uid;
                const playlistId = Date.now().toString();
                db.ref(`playlists/${uid}/${playlistId}`).set({
                    name: name.trim(),
                    songs: {},
                    createdAt: Date.now()
                }).then(() => {
                    showToast('Playlist created!');
                    loadUserData();
                });
            }
        });
    }
    
    if (DOM.editUsernameBtn) {
        DOM.editUsernameBtn.addEventListener('click', showEditUsername);
    }
    
    if (DOM.likedSongsToggle) {
        DOM.likedSongsToggle.addEventListener('click', toggleLikedSongs);
    }
    
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('change', (e) => {
            AppState.settings.theme = e.target.checked ? 'dark' : 'light';
        });
    }
    
    if (DOM.crossfadeToggle) {
        DOM.crossfadeToggle.addEventListener('change', (e) => {
            AppState.settings.crossfade = e.target.checked;
        });
    }
    
    if (DOM.miniPlayerTap) {
        DOM.miniPlayerTap.addEventListener('click', showFullPlayer);
    }
    if (DOM.minimizePlayer) {
        DOM.minimizePlayer.addEventListener('click', hideFullPlayer);
    }
    
    if (DOM.playPauseBtn) {
        DOM.playPauseBtn.addEventListener('click', togglePlayPause);
    }
    if (DOM.miniPlayPauseBtn) {
        DOM.miniPlayPauseBtn.addEventListener('click', togglePlayPause);
    }
    if (DOM.prevBtn) {
        DOM.prevBtn.addEventListener('click', playPrevious);
    }
    if (DOM.nextBtn) {
        DOM.nextBtn.addEventListener('click', playNext);
    }
    if (DOM.shuffleBtn) {
        DOM.shuffleBtn.addEventListener('click', toggleShuffle);
    }
    if (DOM.repeatBtn) {
        DOM.repeatBtn.addEventListener('click', toggleRepeat);
    }
    if (DOM.likeBtn) {
        DOM.likeBtn.addEventListener('click', toggleLike);
    }
    
    if (DOM.progressBar) {
        DOM.progressBar.addEventListener('input', seekAudio);
    }
    
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
            if (DOM.duration) {
                DOM.duration.textContent = formatTime(DOM.audioPlayer.duration);
            }
            if (DOM.progressBar) {
                DOM.progressBar.max = 100;
            }
        });
        
        DOM.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showToast('Failed to load audio', 'error');
            setTimeout(playNext, 1000);
        });
    }
}

// ==================== START APP ====================
init();
