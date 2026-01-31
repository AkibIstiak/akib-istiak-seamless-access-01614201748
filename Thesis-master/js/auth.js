/**
 * Authentication Module
 * Handles all authentication methods using Firebase v9 Modular Syntax
 * 
 * Features:
 * - Email/Password Login
 * - Signup with Name, Email, Phone, Password
 * - Google Sign-In
 * - Anonymous Authentication
 * - Password Strength Indicator
 * - CAPTCHA (Visual + Audio)
 * - WebAuthn Biometric Login
 * - Centralized Auth State Management
 */

// Import from firebase-config
import {
    auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    updateProfile,
    db,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    firebaseInitialized,
    onAuthStateChanged
} from './firebase-config.js';

// Auth State Management - Single source of truth
let currentUser = null;
let authInitialized = false;
let authUIInitialized = false;

// Auth state listener registry
const authListeners = [];

// ============================================================================
// Initialization Guards
// ============================================================================

/**
 * Initialize centralized auth state management
 * Sets up the single onAuthStateChanged listener
 */
export function initAuthState() {
    if (authInitialized) {
        console.log('Auth state already initialized, skipping...');
        return;
    }
    
    console.log('Initializing auth state management...');
    
    // Set up the single onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        currentUser = user;
        
        console.log('Auth state changed:', user ? `logged in as ${user.email}` : 'logged out');
        
        // Update localStorage immediately
        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userUid', user.uid);
            localStorage.setItem('userDisplayName', user.displayName || 'User');
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userUid');
            localStorage.removeItem('userDisplayName');
        }
        
        // Notify all registered listeners
        authListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
        
        // Update UI
        updateNavbarUI(user);
    });
    
    authInitialized = true;
    console.log('Auth state management initialized successfully');
    
    // Return unsubscribe function for cleanup
    return unsubscribe;
}

/**
 * Initialize UI immediately based on localStorage (before Firebase responds)
 * This prevents flickering by showing the correct state immediately
 */
export function initAuthUI() {
    if (authUIInitialized) {
        console.log('Auth UI already initialized, skipping...');
        return;
    }
    
    console.log('Initializing auth UI from localStorage...');
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserName = localStorage.getItem('userDisplayName') || 'User';
    
    // Update UI immediately based on stored state
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');
    const usernameElement = document.getElementById('navUsername');
    
    if (isLoggedIn) {
        // User is logged in
        authElements.forEach(el => {
            el.style.display = el.tagName === 'LI' ? '' : 'block';
        });
        guestElements.forEach(el => {
            el.style.display = 'none';
        });
        
        if (usernameElement) {
            usernameElement.textContent = storedUserName;
        }
        
        console.log('UI updated: user logged in');
    } else {
        // User is not logged in
        authElements.forEach(el => {
            el.style.display = 'none';
        });
        guestElements.forEach(el => {
            el.style.display = el.tagName === 'LI' ? '' : 'block';
        });
        
        if (usernameElement) {
            usernameElement.textContent = '';
        }
        
        console.log('UI updated: guest mode');
    }
    
    authUIInitialized = true;
}

/**
 * Check if auth is fully initialized
 */
export function isAuthInitialized() {
    return authInitialized;
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Get current user synchronously
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is logged in (from localStorage)
 */
export function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get stored username
 */
export function getStoredUserName() {
    return localStorage.getItem('userDisplayName') || 'User';
}

// ============================================================================
// Auth State Listeners
// ============================================================================

/**
 * Add auth state change listener
 * Returns unsubscribe function
 */
export function addAuthStateListener(listener) {
    if (typeof listener === 'function') {
        authListeners.push(listener);
        
        // Call immediately with current state if user is already logged in
        if (currentUser) {
            setTimeout(() => {
                try {
                    listener(currentUser);
                } catch (error) {
                    console.error('Auth listener error:', error);
                }
            }, 0);
        }
        
        // Return unsubscribe function
        return () => {
            const index = authListeners.indexOf(listener);
            if (index > -1) {
                authListeners.splice(index, 1);
            }
        };
    }
    return () => {};
}

/**
 * Remove all auth state listeners (for cleanup)
 */
export function clearAuthListeners() {
    authListeners.length = 0;
}

// ============================================================================
// Navbar UI Management
// ============================================================================

/**
 * Update navbar UI elements
 * This handles all .auth-only and .guest-only elements with smooth transitions
 */
function updateNavbarUI(user) {
    // Get all auth/guest elements
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');
    const usernameElements = document.querySelectorAll('#navUsername');
    
    // Update username displays
    usernameElements.forEach(el => {
        if (user && el) {
            el.textContent = user.displayName || localStorage.getItem('userDisplayName') || 'User';
        } else if (el) {
            el.textContent = '';
        }
    });
    
    if (user) {
        // User is logged in - show auth elements, hide guest elements
        authElements.forEach(el => {
            el.classList.add('is-visible');
            el.classList.remove('is-hidden');
            // Keep LI elements as default display, set others to block
            el.style.display = el.tagName === 'LI' ? '' : 'block';
        });
        guestElements.forEach(el => {
            el.classList.add('is-hidden');
            el.classList.remove('is-visible');
            el.style.display = 'none';
        });
    } else {
        // User is not logged in - show guest elements, hide auth elements
        authElements.forEach(el => {
            el.classList.add('is-hidden');
            el.classList.remove('is-visible');
            el.style.display = 'none';
        });
    guestElements.forEach(el => {
        el.classList.add('is-visible');
        el.classList.remove('is-hidden');
        el.style.display = el.tagName === 'LI' ? '' : 'block';
    });
    }
}

/**
 * Update username display elements
 */
export function updateUsernameDisplay(user) {
    const usernameElements = document.querySelectorAll('#navUsername, #welcome-username');
    
    usernameElements.forEach(el => {
        if (user && el) {
            el.textContent = user.displayName || localStorage.getItem('userDisplayName') || 'User';
        } else if (el) {
            el.textContent = '';
        }
    });
}

// ============================================================================
// DOM Elements
// ============================================================================

// These will be set by initAuth() when DOM is ready
let loginForm = null;
let signupForm = null;
let passwordInput = null;
let passwordStrength = null;
let captchaCanvas = null;
let captchaInput = null;
let refreshCaptchaBtn = null;
let audioCaptchaBtn = null;
let biometricBtn = null;
let guestModeBtn = null;

// CAPTCHA Variables
let captchaText = '';
const captchaChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

// ============================================================================
// Initialize Authentication Module
// ============================================================================

export function initAuth() {
    console.log('Initializing auth module...');
    
    // Cache DOM elements
    loginForm = document.getElementById('loginForm');
    signupForm = document.getElementById('signupForm');
    passwordInput = document.getElementById('signupPassword');
    passwordStrength = document.getElementById('passwordStrength');
    captchaCanvas = document.getElementById('captchaCanvas');
    captchaInput = document.getElementById('captchaInput');
    refreshCaptchaBtn = document.getElementById('refreshCaptcha');
    audioCaptchaBtn = document.getElementById('audioCaptcha');
    biometricBtn = document.getElementById('biometricLogin');
    guestModeBtn = document.getElementById('guestMode');
    
    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    if (captchaCanvas) {
        generateCaptcha();
    }
    if (refreshCaptchaBtn) {
        refreshCaptchaBtn.addEventListener('click', generateCaptcha);
    }
    if (audioCaptchaBtn) {
        audioCaptchaBtn.addEventListener('click', playAudioCaptcha);
    }
    if (biometricBtn) {
        biometricBtn.addEventListener('click', handleBiometricLogin);
    }
    if (guestModeBtn) {
        guestModeBtn.addEventListener('click', handleGuestLogin);
    }
    
    console.log('Auth module initialized');
}

// ============================================================================
// Login Handlers
// ============================================================================


async function handleLogin(e) {
    e.preventDefault();
    
    if (!auth) {
        showMessage('Firebase is not configured. Please configure Firebase to enable login functionality.', 'error');
        return;
    }
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorElement = document.getElementById('loginError');
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showLoading('loginBtn');
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Double-check user is logged in
        if (!result.user) {
            throw new Error('Login failed - no user data returned');
        }
        
        console.log('Login successful:', result.user.email);
        
        // Clear any previous error messages
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);
    } catch (error) {
        console.error('Login error:', error);
        
        // Check if user is actually logged in despite the error
        if (auth?.currentUser) {
            console.log('User is logged in despite error, redirecting...');
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'journal.html';
            }, 1500);
        } else {
            if (errorElement) {
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
            showMessage(getErrorMessage(error.code), 'error');
        }
    } finally {
        hideLoading('loginBtn');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    if (!auth) {
        showMessage('Firebase is not configured. Please configure Firebase to enable signup functionality.', 'error');
        return;
    }
    
    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const phone = document.getElementById('signupPhone')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const captcha = document.getElementById('captchaInput')?.value;
    const errorElement = document.getElementById('signupError');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        if (errorElement) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
        }
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (captcha !== captchaText) {
        if (errorElement) {
            errorElement.textContent = 'Invalid CAPTCHA';
            errorElement.style.display = 'block';
        }
        showMessage('Invalid CAPTCHA', 'error');
        return;
    }
    
    const strength = getPasswordStrength(password);
    if (strength === 'weak') {
        if (errorElement) {
            errorElement.textContent = 'Password is too weak. Please use a stronger password.';
            errorElement.style.display = 'block';
        }
        showMessage('Password is too weak', 'error');
        return;
    }
    
    try {
        showLoading('signupBtn');
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        if (!result.user) {
            throw new Error('Signup failed - no user data returned');
        }
        
        await updateProfile(result.user, {
            displayName: name
        });
        
        // Update localStorage with new username
        localStorage.setItem('userDisplayName', name);
        
        await setDoc(doc(db, 'users', result.user.uid), {
            name: name,
            email: email,
            phone: phone || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        console.log('Signup successful:', result.user.email);
        
        // Clear any previous error messages
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        showMessage('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);
    } catch (error) {
        console.error('Signup error:', error);
        
        // Check if user is actually logged in despite the error
        if (auth?.currentUser) {
            console.log('User is logged in despite error, redirecting...');
            localStorage.setItem('userDisplayName', name);
            showMessage('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'journal.html';
            }, 1500);
        } else {
            if (errorElement) {
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
            showMessage(getErrorMessage(error.code), 'error');
        }
    } finally {
        hideLoading('signupBtn');
    }
}

export async function handleGoogleLogin() {
    if (!auth) {
        showMessage('Firebase is not configured. Please configure Firebase to enable Google login.', 'error');
        return;
    }
    
    const provider = new GoogleAuthProvider();
    const errorElement = document.getElementById('authError');
    
    try {
        showLoading('googleBtn');
        const result = await signInWithPopup(auth, provider);
        
        if (!result?.user) {
            throw new Error('Google login failed - no user data returned');
        }
        
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                name: result.user.displayName || 'Google User',
                email: result.user.email,
                phone: result.user.phoneNumber || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        // Update localStorage
        localStorage.setItem('userDisplayName', result.user.displayName || 'Google User');
        
        console.log('Google login successful:', result.user.email);
        
        // Clear any previous error messages
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        showMessage('Google login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);
    } catch (error) {
        console.error('Google login error:', error);
        
        // Check if user is actually logged in despite the error
        if (auth?.currentUser) {
            console.log('User is logged in despite error, redirecting...');
            localStorage.setItem('userDisplayName', auth.currentUser.displayName || 'Google User');
            showMessage('Google login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'journal.html';
            }, 1500);
        } else {
            if (errorElement) {
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
            showMessage(getErrorMessage(error.code), 'error');
        }
    } finally {
        hideLoading('googleBtn');
    }
}

export async function handleGuestLogin() {
    const errorElement = document.getElementById('authError');

    try {
        showLoading('guestMode');

        if (!auth) {
            showMessage('Firebase is not configured. Please configure Firebase to enable guest login.', 'error');
            return;
        }

        const result = await signInAnonymously(auth);

        if (!result?.user) {
            throw new Error('Guest login failed - no user data returned');
        }

        localStorage.setItem('userDisplayName', 'Guest');
        localStorage.setItem('isLoggedIn', 'true');

        // Clear any previous error messages
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        showMessage('Welcome, Guest! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);
    } catch (error) {
        console.error('Guest login error:', error);

        // Check if user is actually logged in despite the error
        if (auth?.currentUser) {
            localStorage.setItem('userDisplayName', 'Guest');
            showMessage('Welcome, Guest! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'journal.html';
            }, 1500);
        } else {
            if (errorElement) {
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
            showMessage(getErrorMessage(error.code), 'error');
        }
    } finally {
        hideLoading('guestMode');
    }
}

// ============================================================================
// Password Strength Checker
// ============================================================================

function checkPasswordStrength() {
    if (!passwordInput || !passwordStrength) return;
    
    const password = passwordInput.value;
    const strength = getPasswordStrength(password);
    
    let strengthText = '';
    let color = '';
    
    switch (strength) {
        case 'weak':
            strengthText = 'Weak';
            color = '#dc3545';
            break;
        case 'medium':
            strengthText = 'Medium';
            color = '#ffc107';
            break;
        case 'strong':
            strengthText = 'Strong';
            color = '#28a745';
            break;
        default:
            strengthText = '';
            color = '';
    }
    
    passwordStrength.textContent = strengthText ? `Password Strength: ${strengthText}` : '';
    passwordStrength.style.color = color;
    
    // Update strength meter
    passwordStrength.className = `password-strength ${strength}`;
}

function getPasswordStrength(password) {
    if (!password) return 'none';
    
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
}

// ============================================================================
// CAPTCHA
// ============================================================================

function generateCaptcha() {
    captchaText = '';
    const canvas = captchaCanvas;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 6; i++) {
        captchaText += captchaChars.charAt(Math.floor(Math.random() * captchaChars.length));
    }
    console.log('Generated CAPTCHA text:', captchaText); // Debug log
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = getRandomColor();
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = getRandomColor();
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < captchaText.length; i++) {
        const char = captchaText[i];
        const x = 20 + i * 30;
        const y = 35 + Math.random() * 10 - 5;
        const rotation = (Math.random() - 0.5) * 0.3;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
}

function getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function playAudioCaptcha() {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = captchaText.split('').join(' ');
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
    showMessage('Audio CAPTCHA playing...', 'info');
}

// ============================================================================
// Biometric Credential Management
// ============================================================================

/**
 * Register a new biometric credential for the current user
 */
export async function registerBiometricCredential(userId) {
    try {
        if (!window.PublicKeyCredential) {
            throw new Error('WebAuthn is not supported in this browser.');
        }

        if (!auth || !db) {
            throw new Error('Firebase is not configured.');
        }

        // Check if HTTPS (required for WebAuthn except localhost)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            throw new Error('Biometric authentication requires HTTPS.');
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to register biometric credentials.');
        }

        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: 'Journal/Blog',
                id: window.location.hostname
            },
            user: {
                id: new Uint8Array(16), // Generate a unique user handle
                name: user.email || user.displayName || 'User',
                displayName: user.displayName || 'User'
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Prefer platform authenticators (built-in)
                userVerification: 'required', // Require user verification
                residentKey: 'preferred' // Allow discoverable credentials
            },
            timeout: 60000,
            attestation: 'direct'
        };

        // Generate random user ID for WebAuthn
        window.crypto.getRandomValues(publicKeyCredentialCreationOptions.user.id);

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        if (!credential) {
            throw new Error('Failed to create biometric credential.');
        }

        // Store credential in Firestore
        const credentialData = {
            credentialId: arrayBufferToBase64(credential.rawId),
            publicKey: arrayBufferToBase64(credential.response.publicKey),
            userHandle: arrayBufferToBase64(publicKeyCredentialCreationOptions.user.id),
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp(),
            deviceInfo: {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                hostname: window.location.hostname
            }
        };

        await setDoc(doc(db, 'users', userId, 'biometricCredentials', credential.id), credentialData);

        console.log('Biometric credential registered successfully');
        return credential;

    } catch (error) {
        console.error('Biometric registration error:', error);
        throw error;
    }
}

/**
 * Get stored biometric credentials for a user
 */
export async function getStoredCredentials(userId) {
    try {
        if (!db) {
            throw new Error('Firebase is not configured.');
        }

        const credentialsRef = collection(db, 'users', userId, 'biometricCredentials');
        const querySnapshot = await getDoc(credentialsRef);

        const credentials = [];
        querySnapshot.forEach((doc) => {
            credentials.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return credentials;
    } catch (error) {
        console.error('Error getting stored credentials:', error);
        return [];
    }
}

/**
 * Verify biometric credential and authenticate user
 */
export async function verifyBiometricCredential(credentialId) {
    try {
        if (!window.PublicKeyCredential) {
            throw new Error('WebAuthn is not supported in this browser.');
        }

        if (!auth || !db) {
            throw new Error('Firebase is not configured.');
        }

        // Check if HTTPS (required for WebAuthn except localhost)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            throw new Error('Biometric authentication requires HTTPS.');
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname,
            allowCredentials: [] // Allow any credential for this RP
        };

        const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        if (!credential) {
            throw new Error('Biometric verification failed.');
        }

        // Verify credential exists in our database
        const credentialDoc = await getDoc(doc(db, 'users', credentialId, 'biometricCredentials', credential.id));

        if (!credentialDoc.exists()) {
            throw new Error('Biometric credential not found. Please register your biometric authentication first.');
        }

        // Update last used timestamp
        await updateDoc(doc(db, 'users', credentialId, 'biometricCredentials', credential.id), {
            lastUsed: serverTimestamp()
        });

        console.log('Biometric verification successful');
        return credential;

    } catch (error) {
        console.error('Biometric verification error:', error);
        throw error;
    }
}

/**
 * Delete a biometric credential
 */
export async function deleteBiometricCredential(userId, credentialId) {
    try {
        if (!db) {
            throw new Error('Firebase is not configured.');
        }

        await deleteDoc(doc(db, 'users', userId, 'biometricCredentials', credentialId));
        console.log('Biometric credential deleted successfully');

    } catch (error) {
        console.error('Error deleting biometric credential:', error);
        throw error;
    }
}

// ============================================================================
// Biometric Login
// ============================================================================

export async function handleBiometricLogin() {
    const errorElement = document.getElementById('authError');

    try {
        if (!window.PublicKeyCredential) {
            throw new Error('WebAuthn is not supported in this browser. Please use Chrome, Firefox, or Edge.');
        }

        if (!auth || !db) {
            throw new Error('Firebase is not configured. Please configure Firebase to enable biometric login.');
        }

        // Check if HTTPS (required for WebAuthn except localhost)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            throw new Error('Biometric authentication requires HTTPS. Please access this site over a secure connection.');
        }

        showLoading('biometricBtn');

        // Generate challenge for authentication
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname,
            allowCredentials: [] // Allow any available credential
        };

        let credential;

        try {
            // Try to get existing credentials
            credential = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });
        } catch (error) {
            if (error.name === 'NotFoundError') {
                // No credentials found, prompt user to register
                throw new Error('No biometric credentials found. Please set up fingerprint/face recognition on your device first. You may need to register your biometric data first.');
            }
            throw error;
        }

        if (!credential) {
            throw new Error('Biometric verification failed. Please try again.');
        }

        console.log('Biometric verification successful');

        // Sign in anonymously after successful biometric verification
        const result = await signInAnonymously(auth);

        await setDoc(doc(db, 'users', result.user.uid), {
            name: 'Biometric User',
            email: 'biometric@anonymous.com',
            phone: '',
            isBiometric: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        localStorage.setItem('userDisplayName', 'Biometric User');

        showMessage('Biometric verification successful! Logging you in...', 'success');
        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);

    } catch (error) {
        console.error('Biometric login error:', error);

        let errorMessage = error.message;

        if (error.name === 'NotAllowedError') {
            errorMessage = 'Biometric verification was cancelled or not allowed. Please try again or use another login method.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Your browser or device does not support biometric authentication.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No biometric credentials found. Please set up fingerprint/face recognition on your device first.';
        } else if (error.name === 'SecurityError') {
            errorMessage = 'Biometric authentication requires a secure connection (HTTPS).';
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }

        showMessage(errorMessage, 'error');
    } finally {
        hideLoading('biometricBtn');
    }
}

// ============================================================================
// Logout
// ============================================================================

export async function logout() {
    try {
        await signOut(auth);
        console.log('User signed out');
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error logging out: ' + error.message, 'error');
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.dataset.originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Loading...';
    }
}

function hideLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn && btn.dataset.originalHTML) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalHTML;
        delete btn.dataset.originalHTML;
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    document.querySelectorAll('.message').forEach(el => el.remove());
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/user-disabled': 'This account has been disabled.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

