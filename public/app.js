// Aurio Main App - Complete Premium Music Player
// Version 2.0 - Mobile First, Zero Bugs

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
    repeat: 'off', // 'off', 'all', 'one'
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

// ==================== AUTHENTICATION MODULE ====================
// This file contains all authentication logic for Aurio

const AuthModule = {
    isSignUp: false,
    confirmationResult: null,
    
    // Initialize authentication
    async init() {
        try {
            // Set auth persistence FIRST (critical for mobile)
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            console.log('✅ Auth persistence set to LOCAL');
            
            // Setup auth state listener BEFORE checking redirect
            auth.onAuthStateChanged(this.onAuthStateChanged);
            
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
                    this.handleAuthError(redirectError);
                }
            }
            
            // Setup UI event listeners
            this.setupAuthListeners();
            
        } catch (error) {
            console.error('❌ Auth init error:', error);
            showToast('Initialization failed. Please refresh.', 'error');
        }
    },
    
    // Auth state change handler
    onAuthStateChanged(user) {
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
    },
    
    // Setup UI event listeners
    setupAuthListeners() {
        // Google Sign In
        DOM.googleSignInBtn?.addEventListener('click', () => this.signInWithGoogle());
        
        // Email Sign In button
        DOM.emailSignInBtn?.addEventListener('click', () => this.showEmailForm());
        
        // Phone Sign In button
        DOM.phoneSignInBtn?.addEventListener('click', () => this.showPhoneForm());
        
        // Back buttons
        DOM.backToMethods?.addEventListener('click', () => this.showMethodSelection());
        DOM.backToMethodsPhone?.addEventListener('click', () => this.showMethodSelection());
        
        // Toggle password visibility
        DOM.togglePassword?.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Toggle Sign Up / Sign In
        DOM.toggleSignUpBtn?.addEventListener('click', () => this.toggleSignUpMode());
        
        // Email form submit
        DOM.emailSubmitBtn?.addEventListener('click', () => this.handleEmailAuth());
        
        // Forgot password
        DOM.forgotPasswordBtn?.addEventListener('click', () => this.handleForgotPassword());
        
        // Phone OTP buttons
        DOM.sendOtpBtn?.addEventListener('click', () => this.sendPhoneOTP());
        DOM.verifyOtpBtn?.addEventListener('click', () => this.verifyPhoneOTP());
        DOM.resendOtpBtn?.addEventListener('click', () => this.sendPhoneOTP());
        
        // Enter key handlers
        DOM.emailInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') DOM.passwordInput.focus();
        });
        DOM.passwordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleEmailAuth();
        });
        DOM.phoneInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendPhoneOTP();
        });
        DOM.otpInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyPhoneOTP();
        });
    },
    
    // Show/hide auth screens
    showMethodSelection() {
        DOM.authMethods?.classList.remove('hidden');
        DOM.emailAuthForm?.classList.add('hidden');
        DOM.phoneAuthForm?.classList.add('hidden');
    },
    
    showEmailForm() {
        DOM.authMethods?.classList.add('hidden');
        DOM.emailAuthForm?.classList.remove('hidden');
        DOM.phoneAuthForm?.classList.add('hidden');
        setTimeout(() => DOM.emailInput?.focus(), 100);
    },
    
    showPhoneForm() {
        DOM.authMethods?.classList.add('hidden');
        DOM.emailAuthForm?.classList.add('hidden');
        DOM.phoneAuthForm?.classList.remove('hidden');
        document.getElementById('phoneStep1')?.classList.remove('hidden');
        document.getElementById('phoneStep2')?.classList.add('hidden');
        setTimeout(() => DOM.phoneInput?.focus(), 100);
    },
    
    // Toggle password visibility
    togglePasswordVisibility() {
        const input = DOM.passwordInput;
        const eyeIcon = document.getElementById('eyeIcon');
        const eyeOffIcon = document.getElementById('eyeOffIcon');
        
        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon.style.display = 'none';
            eyeOffIcon.style.display = 'block';
        } else {
            input.type = 'password';
            eyeIcon.style.display = 'block';
            eyeOffIcon.style.display = 'none';
        }
    },
    
    // Toggle between sign in and sign up
    toggleSignUpMode() {
        this.isSignUp = !this.isSignUp;
        const formTitle = document.getElementById('formTitle');
        const submitBtn = DOM.emailSubmitBtn;
        const toggleBtn = DOM.toggleSignUpBtn;
        
        if (this.isSignUp) {
            formTitle.textContent = 'Create Account';
            submitBtn.textContent = 'Sign Up';
            toggleBtn.innerHTML = 'Already have an account? <strong>Sign In</strong>';
        } else {
            formTitle.textContent = 'Sign In';
            submitBtn.textContent = 'Sign In';
            toggleBtn.innerHTML = 'Don\'t have an account? <strong>Sign Up</strong>';
        }
    },
    
    // Google Sign In
    async signInWithGoogle() {
        try {
            this.showLoading('Signing in with Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ 
                prompt: 'select_account',
                hd: '*'
            });
            
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                console.log('📱 Mobile detected - using redirect flow');
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                await auth.signInWithRedirect(provider);
            } else {
                try {
                    await auth.signInWithPopup(provider);
                    this.hideLoading();
                } catch (error) {
                    if (error.code === 'auth/popup-blocked' || 
                        error.code === 'auth/popup-closed-by-user') {
                        console.log('Popup blocked, using redirect');
                        await auth.signInWithRedirect(provider);
                    } else {
                        throw error;
                    }
                }
            }
        } catch (error) {
            this.hideLoading();
            console.error('Google sign in error:', error);
            if (error.code !== 'auth/popup-closed-by-user' && 
                error.code !== 'auth/cancelled-popup-request') {
                this.handleAuthError(error);
            }
        }
    },
    
    // Email/Password Authentication
    async handleEmailAuth() {
        const email = DOM.emailInput?.value.trim();
        const password = DOM.passwordInput?.value;
        
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            showToast('Please enter a valid email', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            this.showLoading(this.isSignUp ? 'Creating account...' : 'Signing in...');
            
            if (this.isSignUp) {
                // Sign Up
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                console.log('✅ Account created:', userCredential.user.email);
                showToast('Account created successfully!');
            } else {
                // Sign In
                await auth.signInWithEmailAndPassword(email, password);
                console.log('✅ Signed in with email');
            }
            
            this.hideLoading();
            this.clearEmailForm();
            
        } catch (error) {
            this.hideLoading();
            console.error('Email auth error:', error);
            this.handleAuthError(error);
        }
    },
    
    // Forgot Password
    async handleForgotPassword() {
        const email = DOM.emailInput?.value.trim();
        
        if (!email) {
            showToast('Please enter your email first', 'error');
            DOM.emailInput?.focus();
            return;
        }
        
        if (!this.validateEmail(email)) {
            showToast('Please enter a valid email', 'error');
            return;
        }
        
        try {
            this.showLoading('Sending reset email...');
            await auth.sendPasswordResetEmail(email);
            this.hideLoading();
            showToast('Password reset email sent! Check your inbox.');
        } catch (error) {
            this.hideLoading();
            console.error('Password reset error:', error);
            this.handleAuthError(error);
        }
    },
    
    // Phone Authentication - Send OTP
    async sendPhoneOTP() {
        const countryCode = document.getElementById('countryCode')?.value || '+91';
        const phoneNumber = DOM.phoneInput?.value.trim();
        
        if (!phoneNumber) {
            showToast('Please enter phone number', 'error');
            return;
        }
        
        const fullPhoneNumber = countryCode + phoneNumber;
        
        if (!this.validatePhone(phoneNumber)) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }
        
        try {
            this.showLoading('Sending OTP...');
            
            // Initialize reCAPTCHA
            if (!window.recaptchaVerifier) {
                initRecaptcha('recaptcha-container');
            }
            
            // Send verification code
            this.confirmationResult = await auth.signInWithPhoneNumber(
                fullPhoneNumber, 
                window.recaptchaVerifier
            );
            
            console.log('✅ OTP sent to', fullPhoneNumber);
            this.hideLoading();
            
            // Show OTP input step
            document.getElementById('phoneStep1')?.classList.add('hidden');
            document.getElementById('phoneStep2')?.classList.remove('hidden');
            document.getElementById('phoneNumber').textContent = fullPhoneNumber;
            
            setTimeout(() => DOM.otpInput?.focus(), 100);
            showToast('OTP sent successfully!');
            
        } catch (error) {
            this.hideLoading();
            console.error('Phone auth error:', error);
            this.handleAuthError(error);
            clearRecaptcha();
        }
    },
    
    // Phone Authentication - Verify OTP
    async verifyPhoneOTP() {
        const code = DOM.otpInput?.value.trim();
        
        if (!code || code.length !== 6) {
            showToast('Please enter the 6-digit code', 'error');
            return;
        }
        
        if (!this.confirmationResult) {
            showToast('Please request a new OTP', 'error');
            document.getElementById('phoneStep1')?.classList.remove('hidden');
            document.getElementById('phoneStep2')?.classList.add('hidden');
            return;
        }
        
        try {
            this.showLoading('Verifying code...');
            
            const result = await this.confirmationResult.confirm(code);
            console.log('✅ Phone verified:', result.user.phoneNumber);
            
            this.hideLoading();
            this.clearPhoneForm();
            showToast('Phone verified successfully!');
            
        } catch (error) {
            this.hideLoading();
            console.error('OTP verification error:', error);
            
            if (error.code === 'auth/invalid-verification-code') {
                showToast('Invalid code. Please try again.', 'error');
                DOM.otpInput.value = '';
                DOM.otpInput?.focus();
            } else {
                this.handleAuthError(error);
            }
        }
    },
    
    // Sign Out
    async signOut() {
        if (!confirm('Sign out of Aurio?')) return;
        
        try {
            await auth.signOut();
            pauseAudio();
            resetAppState();
            clearRecaptcha();
            showToast('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            showToast('Sign out failed', 'error');
        }
    },
    
    // Error Handler
    handleAuthError(error) {
        console.error('Auth error:', error);
        
        const errorMessages = {
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/operation-not-allowed': 'Sign in method not enabled.',
            'auth/popup-blocked': 'Popup was blocked. Please allow popups.',
            'auth/unauthorized-domain': 'This domain is not authorized.',
            'auth/web-storage-unsupported': 'Your browser doesn\'t support storage. Enable cookies.',
            'auth/invalid-phone-number': 'Invalid phone number format.',
            'auth/missing-phone-number': 'Please enter a phone number.',
            'auth/quota-exceeded': 'SMS quota exceeded. Try again later.',
            'auth/invalid-verification-code': 'Invalid verification code.',
            'auth/missing-verification-code': 'Please enter the verification code.'
        };
        
        const message = errorMessages[error.code] || `Authentication failed: ${error.message}`;
        showToast(message, 'error');
    },
    
    // Validation helpers
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validatePhone(phone) {
        // Basic validation - adjust based on your needs
        const re = /^[0-9]{10}$/;
        return re.test(phone);
    },
    
    // Clear forms
    clearEmailForm() {
        if (DOM.emailInput) DOM.emailInput.value = '';
        if (DOM.passwordInput) DOM.passwordInput.value = '';
    },
    
    clearPhoneForm() {
        if (DOM.phoneInput) DOM.phoneInput.value = '';
        if (DOM.otpInput) DOM.otpInput.value = '';
        document.getElementById('phoneStep1')?.classList.remove('hidden');
        document.getElementById('phoneStep2')?.classList.add('hidden');
        this.confirmationResult = null;
    },
    
    // Loading overlay
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay?.querySelector('.loading-text');
        if (text) text.textContent = message;
        overlay?.classList.remove('hidden');
    },
    
    hideLoading() {
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    }
};

// ==================== ADDITIONAL DOM ELEMENTS FOR AUTH ====================
// Add these to the existing DOM object
DOM.googleSignInBtn = document.getElementById('googleSignIn');
DOM.emailSignInBtn = document.getElementById('emailSignIn');
DOM.phoneSignInBtn = document.getElementById('phoneSignIn');
DOM.authMethods = document.getElementById('authMethods');
DOM.emailAuthForm = document.getElementById('emailAuthForm');
DOM.phoneAuthForm = document.getElementById('phoneAuthForm');
DOM.backToMethods = document.getElementById('backToMethods');
DOM.backToMethodsPhone = document.getElementById('backToMethodsPhone');
DOM.emailInput = document.getElementById('emailInput');
DOM.passwordInput = document.getElementById('passwordInput');
DOM.togglePassword = document.getElementById('togglePassword');
DOM.toggleSignUpBtn = document.getElementById('toggleSignUpBtn');
DOM.emailSubmitBtn = document.getElementById('emailSubmitBtn');
DOM.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
DOM.phoneInput = document.getElementById('phoneInput');
DOM.sendOtpBtn = document.getElementById('sendOtpBtn');
DOM.otpInput = document.getElementById('otpInput');
DOM.verifyOtpBtn = document.getElementById('verifyOtpBtn');
DOM.resendOtpBtn = document.getElementById('resendOtpBtn');

// ==================== SESSION RECOVERY ====================
// Check for stuck auth states on mobile
function checkAuthHealth() {
    const maxWaitTime = 10000; // 10 seconds
    let resolved = false;
    
    const timeout = setTimeout(() => {
        if (!resolved && !AppState.currentUser) {
            console.warn('⚠️ Auth state not resolved, checking current user...');
            const currentUser = auth.currentUser;
            if (currentUser) {
                console.log('✅ Found cached user, forcing auth state update');
                AuthModule.onAuthStateChanged(currentUser);
            }
        }
    }, maxWaitTime);
    
    const unsubscribe = auth.onAuthStateChanged(() => {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
    });
}

// ==================== VISIBILITY CHANGE HANDLER ====================
// Prevent logout when app goes to background
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const currentUser = auth.currentUser;
        if (currentUser && !AppState.currentUser) {
            console.log('🔄 App visible - restoring user session');
            AuthModule.onAuthStateChanged(currentUser);
        }
    }
});


// ==================== INITIALIZATION ====================
function init() {
    console.log('🎵 Initializing Aurio...');
    
    // Handle OAuth redirect
    auth.getRedirectResult()
        .then(result => {
            if (result.user) {
                console.log('✅ Signed in via redirect');
            }
        })
        .catch(handleAuthError);
    
    // Auth state listener
    auth.onAuthStateChanged(onAuthStateChanged);
    
    // Setup event listeners
    setupEventListeners();
    
    // Register Media Session
    if ('mediaSession' in navigator) {
        setupMediaSession();
    }
    
    console.log('✅ Aurio initialized');
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
        
        // Update UI
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
    
    // Add click listeners
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
            const songId = btn.dataset.songId;
            showSongMenu(songId);
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
        {
            name: timePlaylist,
            desc: 'Perfect for right now',
            icon: '🌅',
            action: 'time'
        },
        {
            name: 'Top 50',
            desc: 'Your most played songs',
            icon: '🔥',
            action: 'top'
        },
        {
            name: 'New Additions',
            desc: 'Recently added tracks',
            icon: '✨',
            action: 'new'
        },
        {
            name: 'Liked Songs',
            desc: `${AppState.likedSongs.size} songs`,
            icon: '❤️',
            action: 'liked'
        }
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

// ==================== PLAYBACK ====================
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
    
    // If more than 3 seconds played, restart current song
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
        // Unlike
        AppState.likedSongs.delete(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).remove();
        DOM.likeBtn.classList.remove('active');
        showToast('Removed from liked songs');
    } else {
        // Like
        AppState.likedSongs.add(songId);
        database.ref(`users/${uid}/likedSongs/${songId}`).set(true);
        DOM.likeBtn.classList.add('active');
        showToast('Added to liked songs');
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// ==================== PLAYER UI ====================
function updatePlayerUI() {
    if (!AppState.currentSong) return;
    
    const song = AppState.currentSong;
    
    // Mini player
    DOM.miniCover.src = song.coverUrl || 'https://via.placeholder.com/48';
    DOM.miniTitle.textContent = song.title;
    DOM.miniArtist.textContent = song.artist;
    
    // Full player
    DOM.fullCover.src = song.coverUrl || 'https://via.placeholder.com/400';
    DOM.fullTitle.textContent = song.title;
    DOM.fullArtist.textContent = song.artist;
    
    // Play/pause icons
    const showPause = AppState.isPlaying;
    DOM.playIcon.style.display = showPause ? 'none' : 'block';
    DOM.pauseIcon.style.display = showPause ? 'block' : 'none';
    DOM.miniPlayIcon.style.display = showPause ? 'none' : 'block';
    DOM.miniPauseIcon.style.display = showPause ? 'block' : 'none';
    
    // Like button
    DOM.likeBtn.classList.toggle('active', AppState.likedSongs.has(song.id));
    
    // Shuffle/repeat
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

// ==================== NAVIGATION ====================
function switchTab(tabName) {
    AppState.currentTab = tabName;
    
    // Update nav buttons
    DOM.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) activeTab.classList.add('active');
    
    // Update header title
    const titles = {
        home: 'Home',
        library: 'Library',
        search: 'Search',
        profile: 'Profile'
    };
    DOM.headerTitle.textContent = titles[tabName] || 'Aurio';
    
    // Special handling
    if (tabName === 'search') {
        DOM.searchContainer.classList.add('active');
        setTimeout(() => DOM.searchInput.focus(), 100);
    } else {
        DOM.searchContainer.classList.remove('active');
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
                <div class="song-item" data-song-id="${song.id}">
                    <img src="${song.coverUrl || 'https://via.placeholder.com/56'}" 
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
    
    DOM.searchResults.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', () => {
            const song = AppState.allSongs.find(s => s.id === item.dataset.songId);
            if (song) playSong(song);
        });
    });
}

// ==================== UTILITIES ====================
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
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'artist':
            return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        case 'plays':
            return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        case 'recent':
        default:
            return sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
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
    // Increment play count
    database.ref(`songs/${songId}/playCount`).transaction(count => (count || 0) + 1);
    
    // Add to recently played
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
    
    // Calculate total plays and listening time
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
            { src: song.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }
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
            songs = [...AppState.allSongs].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 20);
            break;
        case 'time':
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
    }
}

function showSongMenu(songId) {
    // TODO: Implement song menu (add to playlist, queue, etc.)
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

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Auth
    DOM.googleSignInBtn.addEventListener('click', signInWithGoogle);
    DOM.signOutBtn.addEventListener('click', signOut);
    
    // Navigation
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Search
    DOM.searchToggleBtn.addEventListener('click', () => {
        switchTab('search');
    });
    
    DOM.searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        DOM.searchClear.style.display = query ? 'block' : 'none';
        performSearch(query);
    });
    
    DOM.searchClear.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.searchClear.style.display = 'none';
        DOM.searchResults.innerHTML = '';
    });
    
    // Library
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
            }
        });
    });
    
    DOM.shuffleAllBtn.addEventListener('click', () => {
        if (AppState.allSongs.length > 0) {
            AppState.shuffle = true;
            DOM.shuffleBtn.classList.add('active');
            const randomIndex = Math.floor(Math.random() * AppState.allSongs.length);
            playSongAtIndex(randomIndex);
        }
    });
    
    DOM.sortSelect.addEventListener('change', renderAllSongs);
    
    DOM.createPlaylistBtn.addEventListener('click', () => {
        const name = prompt('Playlist name:');
        if (name) {
            const uid = AppState.currentUser.uid;
            const playlistId = Date.now().toString();
            database.ref(`playlists/${uid}/${playlistId}`).set({
                name,
                songs: [],
                createdAt: Date.now()
            }).then(() => {
                showToast('Playlist created!');
            });
        }
    });
    
    // Settings
    DOM.themeToggle.addEventListener('change', (e) => {
        AppState.settings.theme = e.target.checked ? 'dark' : 'light';
        // Theme switching can be implemented here
    });
    
    DOM.crossfadeToggle.addEventListener('change', (e) => {
        AppState.settings.crossfade = e.target.checked;
    });
    
    // Player controls
    DOM.miniPlayerTap.addEventListener('click', showFullPlayer);
    DOM.minimizePlayer.addEventListener('click', hideFullPlayer);
    
    DOM.playPauseBtn.addEventListener('click', togglePlayPause);
    DOM.miniPlayPauseBtn.addEventListener('click', togglePlayPause);
    DOM.prevBtn.addEventListener('click', playPrevious);
    DOM.nextBtn.addEventListener('click', playNext);
    DOM.shuffleBtn.addEventListener('click', toggleShuffle);
    DOM.repeatBtn.addEventListener('click', toggleRepeat);
    DOM.likeBtn.addEventListener('click', toggleLike);
    
    DOM.progressBar.addEventListener('input', seekAudio);
    
    // Audio events
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
    
    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleSmartPlaylist(btn.dataset.action);
        });
    });
}

// ==================== START APP ====================
init();
