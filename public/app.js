let currentUser = null;
let allSongs = [];
let recentlyPlayed = [];
let likedSongs = [];
let currentSong = null;
let currentQueue = [];
let currentQueueIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0;

const audioPlayer = document.getElementById('audioPlayer');
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initPlayer();
    registerServiceWorker();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/serviceworker.js').catch(() => {});
    }
}

function initAuth() {
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const showSignInBtn = document.getElementById('showSignInBtn');
    const showSignUpBtn = document.getElementById('showSignUpBtn');
    const backFromSignIn = document.getElementById('backFromSignIn');
    const backFromSignUp = document.getElementById('backFromSignUp');
    const authButtons = document.getElementById('authButtons');

    showSignInBtn.addEventListener('click', () => {
        authButtons.style.display = 'none';
        signInForm.classList.add('active');
    });

    showSignUpBtn.addEventListener('click', () => {
        authButtons.style.display = 'none';
        signUpForm.classList.add('active');
    });

    backFromSignIn.addEventListener('click', () => {
        signInForm.classList.remove('active');
        authButtons.style.display = 'flex';
        document.getElementById('signInError').textContent = '';
    });

    backFromSignUp.addEventListener('click', () => {
        signUpForm.classList.remove('active');
        authButtons.style.display = 'flex';
        document.getElementById('signUpError').textContent = '';
    });

    signInForm.addEventListener('submit', handleSignIn);
    signUpForm.addEventListener('submit', handleSignUp);
    document.getElementById('logoutPending').addEventListener('click', handleLogout);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    auth.onAuthStateChanged(user => {
        if (user) {
            checkUserApproval(user);
        } else {
            showAuthScreen();
        }
    });
}

async function handleSignIn(e) {
    e.preventDefault();
    const username = document.getElementById('signInUsername').value.trim();
    const password = document.getElementById('signInPassword').value;
    const errorDiv = document.getElementById('signInError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const email = `${username.toLowerCase()}@aurio.app`;
        await auth.signInWithEmailAndPassword(email, password);
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
            ? 'Invalid username or password'
            : 'Sign in failed. Please try again.';
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const username = document.getElementById('signUpUsername').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm = document.getElementById('signUpConfirm').value;
    const errorDiv = document.getElementById('signUpError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        return;
    }

    if (username.length < 3) {
        errorDiv.textContent = 'Username must be at least 3 characters';
        return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const email = `${username.toLowerCase()}@aurio.app`;
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await db.ref(`users/${userCredential.user.uid}`).set({
            username: username,
            approved: false,
            createdAt: Date.now(),
            likedSongs: {},
            playlists: {},
            recentlyPlayed: []
        });

        errorDiv.textContent = '';
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            errorDiv.textContent = 'Username already taken';
        } else if (error.code === 'auth/weak-password') {
            errorDiv.textContent = 'Password is too weak';
        } else {
            errorDiv.textContent = 'Failed to create account. Please try again.';
        }
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function checkUserApproval(user) {
    const userRef = db.ref(`users/${user.uid}`);
    
    userRef.on('value', async (snapshot) => {
        const userData = snapshot.val();
        
        if (!userData) {
            await handleLogout();
            return;
        }

        if (userData.approved === false) {
            showPendingApproval();
        } else {
            currentUser = { uid: user.uid, ...userData };
            await initApp();
        }
    });
}

function showAuthScreen() {
    authScreen.classList.add('active');
    appScreen.classList.remove('active');
    document.getElementById('signInError').textContent = '';
    document.getElementById('signUpError').textContent = '';
    document.getElementById('signInForm').reset();
    document.getElementById('signUpForm').reset();
    document.getElementById('signInForm').classList.remove('active');
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('pendingApproval').classList.remove('active');
}

function showPendingApproval() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('signInForm').classList.remove('active');
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('pendingApproval').classList.add('active');
}

async function handleLogout() {
    await auth.signOut();
    currentUser = null;
    allSongs = [];
    recentlyPlayed = [];
    likedSongs = [];
    currentSong = null;
    currentQueue = [];
    isPlaying = false;
    audioPlayer.pause();
    audioPlayer.src = '';
    document.getElementById('miniPlayer').classList.remove('active');
    document.getElementById('fullPlayer').classList.remove('active');
    showAuthScreen();
}

async function initApp() {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
    
    updateGreeting();
    setInterval(updateGreeting, 60000);
    
    await loadSongs();
    await loadUserData();
    
    initNavigation();
    initProfileScreen();
    renderHome();
    renderLibrary();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    let emoji = '🌙';
    
    if (hour < 12) {
        greeting = 'Good Morning';
        emoji = '☀️';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
        emoji = '👋';
    }
    
    document.getElementById('greetingText').textContent = `${greeting}, ${currentUser.username}`;
    document.getElementById('greetingEmoji').textContent = emoji;
}

async function loadSongs() {
    return new Promise((resolve) => {
        db.ref('songs').on('value', (snapshot) => {
            const data = snapshot.val();
            allSongs = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
            resolve();
        });
    });
}

async function loadUserData() {
    const userData = await db.ref(`users/${currentUser.uid}`).once('value');
    const data = userData.val();
    
    likedSongs = data.likedSongs ? Object.keys(data.likedSongs) : [];
    recentlyPlayed = data.recentlyPlayed || [];
}

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
            
            if (viewId === 'profileView') renderProfile();
            if (viewId === 'searchView') {
                setTimeout(() => document.getElementById('searchInput').focus(), 100);
            }
        });
    });
    
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(e), 300);
    });
    
    document.getElementById('backFromArtist').addEventListener('click', () => {
        document.getElementById('artistView').classList.remove('active');
        document.getElementById('homeView').classList.add('active');
    });

    document.getElementById('changePasswordBtn').addEventListener('click', showPasswordModal);
    document.getElementById('closePasswordModal').addEventListener('click', closePasswordModal);
    document.getElementById('cancelPassword').addEventListener('click', closePasswordModal);
    document.getElementById('passwordForm').addEventListener('submit', handleChangePassword);
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Start typing to search</p></div>';
        return;
    }
    
    const filtered = allSongs.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.album && song.album.toLowerCase().includes(query))
    );
    
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😔</div><p>No songs found</p></div>';
        return;
    }
    
    renderSongList(filtered, resultsDiv);
}

function renderHome() {
    renderRecentlyPlayed();
    renderAIRecommendations();
    renderOldIsGold();
    renderMostPlayed();
    renderArtists();
    renderHomePlaylists();
}

function renderRecentlyPlayed() {
    const container = document.getElementById('recentlyPlayed');
    const section = document.getElementById('recentlyPlayedSection');
    const recent = recentlyPlayed.slice(0, 6).map(id => allSongs.find(s => s.id === id)).filter(Boolean);
    
    if (recent.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    renderSongGrid(recent, container);
}

function renderAIRecommendations() {
    const container = document.getElementById('aiRecommendations');
    const titleEl = document.getElementById('aiSectionTitle');
    const section = document.getElementById('aiRecommendationsSection');
    
    const hour = new Date().getHours();
    let mood = 'energetic';
    let title = 'Energy Boost';
    
    if (hour < 12) {
        mood = 'calm';
        title = 'Morning Vibes';
    } else if (hour < 18) {
        mood = 'energetic';
        title = 'Afternoon Energy';
    } else {
        mood = 'chill';
        title = 'Evening Chill';
    }
    
    titleEl.textContent = title;
    
    let filtered = allSongs.filter(s => s.mood === mood);
    
    if (recentlyPlayed.length > 0) {
        const recentIds = recentlyPlayed.slice(0, 10);
        filtered = filtered.filter(s => !recentIds.includes(s.id));
    }
    
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 6);
    
    if (shuffled.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    renderSongGrid(shuffled, container);
}

function renderOldIsGold() {
    const container = document.getElementById('oldIsGold');
    const old = allSongs.filter(s => s.year && parseInt(s.year) < 2005);
    const shuffled = old.sort(() => Math.random() - 0.5).slice(0, 6);
    
    if (shuffled.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No classic songs available</p></div>';
        return;
    }
    
    renderSongGrid(shuffled, container);
}

function renderMostPlayed() {
    const container = document.getElementById('mostPlayed');
    const sorted = [...allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 6);
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No songs available</p></div>';
        return;
    }
    
    renderSongGrid(sorted, container);
}

function renderArtists() {
    const container = document.getElementById('artistsList');
    const artistMap = {};
    
    allSongs.forEach(song => {
        if (song.artist) {
            if (!artistMap[song.artist]) {
                artistMap[song.artist] = [];
            }
            artistMap[song.artist].push(song);
        }
    });
    
    const artists = Object.keys(artistMap).slice(0, 12);
    
    if (artists.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No artists available</p></div>';
        return;
    }
    
    db.ref('artists').once('value', snapshot => {
        const artistData = snapshot.val() || {};
        
        container.innerHTML = artists.map(artist => {
            const initial = artist.charAt(0).toUpperCase();
            const data = artistData[encodeArtistKey(artist)] || {};
            const cover = data.cover || '';
            
            return `
                <div class="artist-card" onclick="showArtist('${escapeHtml(artist)}')">
                    <div class="artist-avatar">
                        ${cover ? `<img src="${cover}" alt="${escapeHtml(artist)}">` : initial}
                    </div>
                    <div class="artist-name">${escapeHtml(artist)}</div>
                </div>
            `;
        }).join('');
    });
}

function showArtist(artistName) {
    const songs = allSongs.filter(s => s.artist === artistName);
    
    document.getElementById('homeView').classList.remove('active');
    document.getElementById('artistView').classList.add('active');
    document.getElementById('artistName').textContent = artistName;
    
    db.ref(`artists/${encodeArtistKey(artistName)}`).once('value', snapshot => {
        const artistData = snapshot.val() || {};
        
        const coverEl = document.getElementById('artistCover');
        const bioEl = document.getElementById('artistBio');
        const genresEl = document.getElementById('artistGenres');
        const statsEl = document.getElementById('artistStats');
        
        if (artistData.cover) {
            coverEl.src = artistData.cover;
            coverEl.style.display = 'block';
        } else {
            coverEl.style.display = 'none';
        }
        
        if (artistData.bio) {
            bioEl.textContent = artistData.bio;
            bioEl.style.display = 'block';
        } else {
            bioEl.style.display = 'none';
        }
        
        if (artistData.genres && artistData.genres.length > 0) {
            genresEl.innerHTML = artistData.genres.map(g => 
                `<span class="artist-genre-tag">${escapeHtml(g)}</span>`
            ).join('');
            genresEl.style.display = 'flex';
        } else {
            genresEl.style.display = 'none';
        }
        
        const totalPlays = songs.reduce((sum, s) => sum + (s.playCount || 0), 0);
        statsEl.innerHTML = `
            <span>${songs.length} songs</span>
            <span>•</span>
            <span>${totalPlays.toLocaleString()} plays</span>
        `;
    });
    
    renderSongList(songs, document.getElementById('artistSongs'));
}

function renderHomePlaylists() {
    db.ref('playlists').limitToFirst(6).once('value', snapshot => {
        const playlists = snapshot.val();
        const container = document.getElementById('homePlaylistsList');
        
        if (!playlists) {
            container.innerHTML = '';
            return;
        }
        
        const playlistArray = Object.keys(playlists).map(id => ({ id, ...playlists[id] }));
        
        container.innerHTML = playlistArray.map(pl => `
            <div class="song-card" onclick="playPlaylist('${pl.id}')">
                <img src="${pl.cover || 'https://via.placeholder.com/160'}" alt="${escapeHtml(pl.name)}">
                <div class="song-card-info">
                    <div class="song-card-title">${escapeHtml(pl.name)}</div>
                    <div class="song-card-artist">${pl.songs ? Object.keys(pl.songs).length : 0} songs</div>
                </div>
            </div>
        `).join('');
    });
}

function renderLibrary() {
    const container = document.getElementById('allSongsList');
    
    if (allSongs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>No songs in library</p></div>';
        return;
    }
    
    renderSongList(allSongs, container);
}

function renderSongGrid(songs, container) {
    if (songs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No songs available</p></div>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="song-card" onclick="playSong('${song.id}')">
            <img src="${song.cover || 'https://via.placeholder.com/160'}" alt="${escapeHtml(song.title)}">
            <div class="song-card-info">
                <div class="song-card-title">${escapeHtml(song.title)}</div>
                <div class="song-card-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('');
}

function renderSongList(songs, container) {
    if (songs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No songs available</p></div>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="song-item" onclick="playSong('${song.id}')">
            <img src="${song.cover || 'https://via.placeholder.com/56'}" alt="${escapeHtml(song.title)}">
            <div class="song-item-info">
                <div class="song-item-title">${escapeHtml(song.title)}</div>
                <div class="song-item-artist">${escapeHtml(song.artist)}</div>
            </div>
        </div>
    `).join('');
}

function initProfileScreen() {
    const avatar = document.getElementById('profileAvatar');
    const username = document.getElementById('profileUsername');
    
    avatar.textContent = currentUser.username.charAt(0).toUpperCase();
    username.textContent = currentUser.username;
}

function renderProfile() {
    const likedContainer = document.getElementById('likedSongsList');
    const liked = likedSongs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
    
    document.getElementById('likedCount').textContent = liked.length;
    
    if (liked.length === 0) {
        likedContainer.innerHTML = '<div class="empty-state"><p>No liked songs yet</p></div>';
    } else {
        renderSongList(liked, likedContainer);
    }
    
    loadPlaylists();
}

async function loadPlaylists() {
    const playlistsRef = await db.ref('playlists').once('value');
    const playlists = playlistsRef.val();
    const container = document.getElementById('playlistsList');
    
    if (!playlists) {
        container.innerHTML = '<div class="empty-state"><p>No playlists available</p></div>';
        return;
    }
    
    const playlistArray = Object.keys(playlists).map(id => ({ id, ...playlists[id] }));
    
    container.innerHTML = playlistArray.map(pl => `
        <div class="song-card" onclick="playPlaylist('${pl.id}')">
            <img src="${pl.cover || 'https://via.placeholder.com/160'}" alt="${escapeHtml(pl.name)}">
            <div class="song-card-info">
                <div class="song-card-title">${escapeHtml(pl.name)}</div>
                <div class="song-card-artist">${pl.songs ? Object.keys(pl.songs).length : 0} songs</div>
            </div>
        </div>
    `).join('');
}

function playPlaylist(playlistId) {
    db.ref(`playlists/${playlistId}`).once('value', snapshot => {
        const playlist = snapshot.val();
        if (playlist && playlist.songs) {
            const songIds = Object.keys(playlist.songs);
            const songs = songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
            
            if (songs.length > 0) {
                currentQueue = songs;
                currentQueueIndex = 0;
                playSong(songs[0].id);
            }
        }
    });
}

function showPasswordModal() {
    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordError').textContent = '';
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    const errorDiv = document.getElementById('passwordError');
    
    if (newPass !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }
    
    if (newPass.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    try {
        const user = auth.currentUser;
        const email = user.email;
        const credential = firebase.auth.EmailAuthProvider.credential(email, current);
        
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPass);
        
        closePasswordModal();
        alert('Password changed successfully');
    } catch (error) {
        errorDiv.textContent = 'Current password is incorrect';
    }
}

function initPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    const fullPlayer = document.getElementById('fullPlayer');
    
    miniPlayer.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            fullPlayer.classList.add('active');
        }
    });
    
    document.getElementById('closePlayer').addEventListener('click', () => {
        fullPlayer.classList.remove('active');
    });
    
    document.getElementById('miniPlayPause').addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });
    
    document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', playPrevious);
    document.getElementById('nextBtn').addEventListener('click', playNext);
    document.getElementById('shuffleBtn').addEventListener('click', toggleShuffle);
    document.getElementById('repeatBtn').addEventListener('click', toggleRepeat);
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    
    const progressBar = document.getElementById('progressBar');
    const volumeSlider = document.getElementById('volumeSlider');
    
    progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = time;
    });
    
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('totalTime').textContent = formatTime(audioPlayer.duration);
    });
    
    audioPlayer.volume = 0.8;
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
}

function playSong(songId) {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;
    
    currentSong = song;
    
    audioPlayer.src = song.url;
    audioPlayer.play();
    isPlaying = true;
    
    updatePlayerUI();
    updateMiniPlayer();
    
    miniPlayer.classList.add('active');
    
    addToRecentlyPlayed(songId);
    incrementPlayCount(songId);
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album || 'Unknown Album',
            artwork: [
                { src: song.cover || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }
            ]
        });
    }
}

function updatePlayerUI() {
    if (!currentSong) return;
    
    document.getElementById('playerCover').src = currentSong.cover || 'https://via.placeholder.com/320';
    document.getElementById('playerTitle').textContent = currentSong.title;
    document.getElementById('playerArtist').textContent = currentSong.artist;
    document.getElementById('playerBg').style.backgroundImage = `url('${currentSong.cover || ''}')`;
    
    const likeBtn = document.getElementById('likeBtn');
    if (likedSongs.includes(currentSong.id)) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'none');
    }
    
    updatePlayPauseButtons();
}

function updateMiniPlayer() {
    if (!currentSong) return;
    
    document.getElementById('miniCover').src = currentSong.cover || 'https://via.placeholder.com/50';
    document.getElementById('miniTitle').textContent = currentSong.title;
    document.getElementById('miniArtist').textContent = currentSong.artist;
    
    updatePlayPauseButtons();
}

function updatePlayPauseButtons() {
    const miniBtn = document.getElementById('miniPlayPause');
    const mainBtn = document.getElementById('playPauseBtn');
    
    const pauseSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
    const playSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const mainPlaySvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const mainPauseSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
    
    miniBtn.innerHTML = isPlaying ? pauseSvg : playSvg;
    mainBtn.innerHTML = isPlaying ? mainPauseSvg : mainPlaySvg;
}

function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    updatePlayPauseButtons();
}

function playNext() {
    if (currentQueue.length === 0) {
        generateQueue();
    }
    
    if (isShuffle) {
        currentQueueIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
        currentQueueIndex = (currentQueueIndex + 1) % currentQueue.length;
    }
    
    playSong(currentQueue[currentQueueIndex].id);
}

function playPrevious() {
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
    }
    
    if (currentQueue.length === 0) {
        generateQueue();
    }
    
    currentQueueIndex = (currentQueueIndex - 1 + currentQueue.length) % currentQueue.length;
    playSong(currentQueue[currentQueueIndex].id);
}

function handleSongEnd() {
    if (repeatMode === 1) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        playNext();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 2;
    document.getElementById('repeatBtn').classList.toggle('active', repeatMode === 1);
}

async function toggleLike() {
    if (!currentSong) return;
    
    const isLiked = likedSongs.includes(currentSong.id);
    const likeBtn = document.getElementById('likeBtn');
    
    if (isLiked) {
        likedSongs = likedSongs.filter(id => id !== currentSong.id);
        await db.ref(`users/${currentUser.uid}/likedSongs/${currentSong.id}`).remove();
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'none');
    } else {
        likedSongs.push(currentSong.id);
        await db.ref(`users/${currentUser.uid}/likedSongs/${currentSong.id}`).set(true);
        likeBtn.classList.add('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
    }
}

function generateQueue() {
    if (!currentSong) {
        currentQueue = [...allSongs];
        return;
    }
    
    let queue = [];
    
    const sameMood = allSongs.filter(s => s.mood === currentSong.mood && s.id !== currentSong.id);
    const sameArtist = allSongs.filter(s => s.artist === currentSong.artist && s.id !== currentSong.id);
    const likedFiltered = likedSongs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
    
    queue.push(...sameMood.slice(0, 3));
    queue.push(...sameArtist.slice(0, 2));
    queue.push(...likedFiltered.slice(0, 3));
    
    const remaining = allSongs.filter(s => !queue.find(q => q.id === s.id) && s.id !== currentSong.id);
    queue.push(...remaining);
    
    currentQueue = queue;
    currentQueueIndex = 0;
}

function updateProgress() {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    if (duration) {
        const percent = (current / duration) * 100;
        document.getElementById('progressBar').value = percent;
        document.getElementById('progressFill').style.setProperty('--progress', `${percent}%`);
        document.getElementById('miniProgress').style.setProperty('--progress', `${percent}%`);
        document.getElementById('currentTime').textContent = formatTime(current);
    }
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function addToRecentlyPlayed(songId) {
    recentlyPlayed = recentlyPlayed.filter(id => id !== songId);
    recentlyPlayed.unshift(songId);
    recentlyPlayed = recentlyPlayed.slice(0, 50);
    
    await db.ref(`users/${currentUser.uid}/recentlyPlayed`).set(recentlyPlayed);
    renderRecentlyPlayed();
}

async function incrementPlayCount(songId) {
    const songRef = db.ref(`songs/${songId}/playCount`);
    const snapshot = await songRef.once('value');
    const count = (snapshot.val() || 0) + 1;
    await songRef.set(count);
}

function encodeArtistKey(artist) {
    return artist.replace(/[.#$[\]]/g, '_');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
