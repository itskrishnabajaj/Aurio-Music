// AURIO - SIMPLE 3-METHOD AUTH
// Google + Email + Phone - ALL WORKING

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
    isSignUp: false,
    confirmationResult: null
};

const $ = id => document.getElementById(id);

// ==================== INIT ====================
async function init() {
    console.log('🎵 Aurio Starting...');
    
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log('✅ Logged in:', user.email || user.phoneNumber);
                AppState.currentUser = user;
                showApp();
                loadData();
            } else {
                console.log('❌ Not logged in');
                showAuth();
            }
        });
        
        // Handle redirect
        auth.getRedirectResult().catch(e => console.log('Redirect:', e.message));
        
        setupListeners();
    } catch (e) {
        console.error('Init error:', e);
    }
}

// ==================== AUTH UI ====================
function showAuth() {
    $('authScreen').classList.add('active');
    $('appScreen').classList.remove('active');
    $('authSelection').style.display = 'block';
    $('emailForm').classList.add('hidden');
    $('phoneForm').classList.add('hidden');
}

function showApp() {
    $('authScreen').classList.remove('active');
    $('appScreen').classList.add('active');
    $('userAvatar').src = AppState.currentUser.photoURL || 'https://ui-avatars.com/api/?name=User';
    $('profileAvatar').src = AppState.currentUser.photoURL || 'https://ui-avatars.com/api/?name=User';
    $('profileName').textContent = AppState.currentUser.displayName || 'User';
    $('profileEmail').textContent = AppState.currentUser.email || AppState.currentUser.phoneNumber || '';
}

// ==================== GOOGLE AUTH ====================
async function googleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const isMobile = /Android|iPhone/i.test(navigator.userAgent);
        
        if (isMobile) {
            await auth.signInWithRedirect(provider);
        } else {
            try {
                await auth.signInWithPopup(provider);
            } catch (e) {
                if (e.code === 'auth/popup-blocked') {
                    await auth.signInWithRedirect(provider);
                } else {
                    throw e;
                }
            }
        }
    } catch (e) {
        if (e.code !== 'auth/popup-closed-by-user') {
            toast('Sign in failed: ' + e.message, 'error');
        }
    }
}

// ==================== EMAIL AUTH ====================
function showEmailForm() {
    $('authSelection').style.display = 'none';
    $('emailForm').classList.remove('hidden');
    $('emailTitle').textContent = 'Sign In';
    AppState.isSignUp = false;
}

async function emailAuth() {
    const email = $('emailInput').value.trim();
    const pass = $('passInput').value;
    
    if (!email || !pass) {
        toast('Fill all fields', 'error');
        return;
    }
    
    try {
        if (AppState.isSignUp) {
            await auth.createUserWithEmailAndPassword(email, pass);
            toast('Account created!');
        } else {
            await auth.signInWithEmailAndPassword(email, pass);
            toast('Signed in!');
        }
    } catch (e) {
        toast(e.message, 'error');
    }
}

function toggleSignup() {
    AppState.isSignUp = !AppState.isSignUp;
    $('emailTitle').textContent = AppState.isSignUp ? 'Sign Up' : 'Sign In';
    $('emailSubmit').textContent = AppState.isSignUp ? 'Sign Up' : 'Sign In';
    $('toggleSignup').textContent = AppState.isSignUp ? 'Have account? Sign In' : 'Create account';
}

// ==================== PHONE AUTH ====================
function showPhoneForm() {
    $('authSelection').style.display = 'none';
    $('phoneForm').classList.remove('hidden');
    $('step1').classList.remove('hidden');
    $('step2').classList.add('hidden');
}

async function sendOTP() {
    const phone = $('phoneNum').value.trim();
    
    if (!phone || phone.length < 10) {
        toast('Enter valid phone', 'error');
        return;
    }
    
    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha', {
                size: 'invisible'
            });
        }
        
        AppState.confirmationResult = await auth.signInWithPhoneNumber(phone, window.recaptchaVerifier);
        $('step1').classList.add('hidden');
        $('step2').classList.remove('hidden');
        toast('Code sent!');
    } catch (e) {
        toast('Failed: ' + e.message, 'error');
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    }
}

async function verifyOTP() {
    const code = $('codeInput').value.trim();
    
    if (!code || code.length !== 6) {
        toast('Enter 6-digit code', 'error');
        return;
    }
    
    try {
        await AppState.confirmationResult.confirm(code);
        toast('Verified!');
    } catch (e) {
        toast('Invalid code', 'error');
    }
}

// ==================== DATA ====================
async function loadData() {
    const uid = AppState.currentUser.uid;
    
    try {
        const likedSnap = await database.ref(`users/${uid}/likedSongs`).once('value');
        if (likedSnap.val()) {
            AppState.likedSongs = new Set(Object.keys(likedSnap.val()));
        }
        
        const recentSnap = await database.ref(`users/${uid}/recentlyPlayed`).once('value');
        if (recentSnap.val()) {
            AppState.recentlyPlayed = Object.values(recentSnap.val()).sort((a,b) => b.playedAt - a.playedAt);
        }
        
        database.ref('songs').on('value', snap => {
            const data = snap.val();
            AppState.allSongs = data ? Object.entries(data).map(([id, song]) => ({id, ...song})) : [];
            renderSongs();
            renderPlaylists();
        });
    } catch (e) {
        console.error('Load error:', e);
    }
}

function renderSongs() {
    if (!$('allSongsList')) return;
    
    if (AppState.allSongs.length === 0) {
        $('allSongsList').innerHTML = '<div class="empty-state">No songs yet</div>';
        return;
    }
    
    $('allSongsList').innerHTML = AppState.allSongs.map((song, i) => `
        <div class="song-item" onclick="playSong(${i})">
            <img src="${song.coverUrl || 'https://via.placeholder.com/56'}" class="song-cover">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        </div>
    `).join('');
}

function renderPlaylists() {
    const hour = new Date().getHours();
    let time = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    
    if (!$('smartPlaylists')) return;
    
    $('smartPlaylists').innerHTML = `
        <div class="smart-playlist-card" onclick="playRandom()">
            <div class="smart-playlist-icon">🎵</div>
            <div class="smart-playlist-info">
                <div class="smart-playlist-name">${time} Mix</div>
                <div class="smart-playlist-desc">${AppState.allSongs.length} songs</div>
            </div>
        </div>
        <div class="smart-playlist-card" onclick="playLiked()">
            <div class="smart-playlist-icon">❤️</div>
            <div class="smart-playlist-info">
                <div class="smart-playlist-name">Liked Songs</div>
                <div class="smart-playlist-desc">${AppState.likedSongs.size} songs</div>
            </div>
        </div>
    `;
}

// ==================== PLAYBACK ====================
function playSong(index) {
    if (!AppState.allSongs[index]) return;
    
    const song = AppState.allSongs[index];
    AppState.currentSong = song;
    AppState.currentIndex = index;
    
    const audio = $('audioPlayer');
    audio.src = song.audioUrl;
    audio.play().then(() => {
        AppState.isPlaying = true;
        updatePlayer();
        $('miniPlayer').classList.remove('hidden');
    }).catch(e => toast('Play failed', 'error'));
}

function playRandom() {
    if (AppState.allSongs.length > 0) {
        playSong(Math.floor(Math.random() * AppState.allSongs.length));
    }
}

function playLiked() {
    const liked = AppState.allSongs.filter(s => AppState.likedSongs.has(s.id));
    if (liked.length > 0) {
        const index = AppState.allSongs.indexOf(liked[0]);
        playSong(index);
    }
}

function togglePlay() {
    const audio = $('audioPlayer');
    if (AppState.isPlaying) {
        audio.pause();
        AppState.isPlaying = false;
    } else {
        audio.play().then(() => AppState.isPlaying = true);
    }
    updatePlayer();
}

function playNext() {
    if (AppState.allSongs.length === 0) return;
    const next = (AppState.currentIndex + 1) % AppState.allSongs.length;
    playSong(next);
}

function playPrev() {
    if (AppState.allSongs.length === 0) return;
    const audio = $('audioPlayer');
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        let prev = AppState.currentIndex - 1;
        if (prev < 0) prev = AppState.allSongs.length - 1;
        playSong(prev);
    }
}

function updatePlayer() {
    if (!AppState.currentSong) return;
    
    const song = AppState.currentSong;
    $('miniCover').src = song.coverUrl || '';
    $('miniTitle').textContent = song.title;
    $('miniArtist').textContent = song.artist;
    $('fullCover').src = song.coverUrl || '';
    $('fullTitle').textContent = song.title;
    $('fullArtist').textContent = song.artist;
    
    $('playIcon').style.display = AppState.isPlaying ? 'none' : 'block';
    $('pauseIcon').style.display = AppState.isPlaying ? 'block' : 'none';
    $('miniPlayIcon').style.display = AppState.isPlaying ? 'none' : 'block';
    $('miniPauseIcon').style.display = AppState.isPlaying ? 'block' : 'none';
}

function updateProgress() {
    const audio = $('audioPlayer');
    if (!audio.duration) return;
    
    const percent = (audio.currentTime / audio.duration) * 100;
    $('progressBar').value = percent;
    $('miniProgress').style.width = percent + '%';
    $('currentTime').textContent = formatTime(audio.currentTime);
    $('duration').textContent = formatTime(audio.duration);
}

function seekAudio(e) {
    const audio = $('audioPlayer');
    const percent = e.target.value;
    audio.currentTime = (percent / 100) * audio.duration;
}

function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
}

function toggleLike() {
    if (!AppState.currentSong) return;
    
    const id = AppState.currentSong.id;
    const uid = AppState.currentUser.uid;
    
    if (AppState.likedSongs.has(id)) {
        AppState.likedSongs.delete(id);
        database.ref(`users/${uid}/likedSongs/${id}`).remove();
        $('likeBtn').classList.remove('active');
        toast('Removed');
    } else {
        AppState.likedSongs.add(id);
        database.ref(`users/${uid}/likedSongs/${id}`).set(true);
        $('likeBtn').classList.add('active');
        toast('Liked!');
    }
}

// ==================== NAV ====================
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    $(tab + 'Tab').classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    $('headerTitle').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
}

// ==================== UTILS ====================
function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    $('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function signOut() {
    if (confirm('Sign out?')) {
        auth.signOut();
    }
}

// ==================== LISTENERS ====================
function setupListeners() {
    // Auth
    $('googleBtn').onclick = googleSignIn;
    $('emailBtn').onclick = showEmailForm;
    $('phoneBtn').onclick = showPhoneForm;
    $('emailBack').onclick = showAuth;
    $('phoneBack').onclick = showAuth;
    $('emailSubmit').onclick = emailAuth;
    $('toggleSignup').onclick = toggleSignup;
    $('sendCode').onclick = sendOTP;
    $('verifyCode').onclick = verifyOTP;
    $('signOutBtn').onclick = signOut;
    
    // Player
    $('miniPlayerTap').onclick = () => $('fullPlayer').classList.remove('hidden');
    $('minimizePlayer').onclick = () => $('fullPlayer').classList.add('hidden');
    $('playPauseBtn').onclick = togglePlay;
    $('miniPlayPauseBtn').onclick = togglePlay;
    $('nextBtn').onclick = playNext;
    $('prevBtn').onclick = playPrev;
    $('likeBtn').onclick = toggleLike;
    $('progressBar').oninput = seekAudio;
    
    // Audio
    const audio = $('audioPlayer');
    audio.ontimeupdate = updateProgress;
    audio.onended = playNext;
    
    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
    
    // Library
    document.querySelectorAll('.section-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.library-view').forEach(v => v.classList.remove('active'));
            $(btn.dataset.section + 'View').classList.add('active');
        };
    });
    
    // Quick
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.onclick = () => {
            if (btn.dataset.action === 'liked') playLiked();
            else playRandom();
        };
    });
}

// START
init();
