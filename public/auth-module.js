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
