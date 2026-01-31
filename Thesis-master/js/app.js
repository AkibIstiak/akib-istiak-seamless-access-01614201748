/**
 * Main Application Entry Point
 * Integrates all modules and handles application-wide functionality
 * 
 * Firebase v9 Modular Syntax
 * Vanilla JavaScript - No frameworks
 */

// Import all modules
import './firebase-config.js';
import { initAuth, handleGoogleLogin, logout } from './auth.js';
import { initAccessibility, speakText, accessibilityState } from './accessibility.js';
import { initJournal, loadUserJournals, loadAllJournals } from './journal.js';
import { initTimeTracker, getCurrentSessionTime } from './tracker.js';
import { initDraft } from './draft.js';
import { initNetworkStatus, getNetworkStatus, isOnline } from './network.js';

// Application state
const AppState = {
    isInitialized: false,
    currentPage: 'home',
    user: null
};

// DOM Elements
let mainNav;
let pageContainer;

/**
 * Initialize Application
 */
export async function initApp() {
    console.log('Initializing Journal/Blog Application...');
    
    // Detect current page
    detectCurrentPage();
    
    // Initialize all modules
    try {
        // Initialize network status first (should work offline)
        initNetworkStatus();
        
        // Initialize accessibility features
        initAccessibility();
        
        // Initialize authentication
        initAuth();
        
        // Initialize journal module
        if (document.getElementById('journals-container')) {
            initJournal();
        }
        
        // Initialize draft auto-save
        if (document.getElementById('journalForm')) {
            initDraft();
        }
        
        // Initialize time tracker
        if (document.getElementById('time-tracker')) {
            initTimeTracker();
        }
        
        // Setup navigation
        setupNavigation();
        
        // Setup global event listeners
        setupGlobalListeners();
        
        AppState.isInitialized = true;
        console.log('Application initialized successfully');
        
        // Log network status
        const netStatus = getNetworkStatus();
        console.log('Network status:', netStatus.status, netStatus.quality);
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

/**
 * Detect Current Page
 */
function detectCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('auth.html')) {
        AppState.currentPage = 'auth';
    } else if (path.includes('home.html')) {
        AppState.currentPage = 'home';
    } else if (path.includes('profile.html')) {
        AppState.currentPage = 'profile';
    } else {
        AppState.currentPage = 'index'; // Default to home
    }
    
    console.log('Current page:', AppState.currentPage);
}

/**
 * Setup Navigation
 */
function setupNavigation() {
    mainNav = document.getElementById('main-nav');
    
    // Handle navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Handle logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
    
    // Handle Google login button
    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Update UI based on auth state
    updateNavigationUI();
}

/**
 * Handle Navigation Click
 */
function handleNavigation(e) {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    
    if (href) {
        window.location.href = href;
    }
}

/**
 * Update Navigation UI Based on Auth State
 */
function updateNavigationUI() {
    // This will be called by auth state changes in other modules
    // For now, we'll check localStorage for quick UI updates
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
}

/**
 * Setup Global Event Listeners
 */
function setupGlobalListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible');
            // Could trigger re-sync of data here
        } else {
            console.log('Page hidden');
        }
    });
    
    // Handle beforeunload
    window.addEventListener('beforeunload', (e) => {
        // Show confirmation dialog if user has unsaved data
        // Note: Modern browsers may not show this
        if (hasUnsavedData()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Check if User Has Unsaved Data
 */
function hasUnsavedData() {
    // Check if there are unsaved form changes
    const draftForm = document.getElementById('journalForm');
    if (draftForm) {
        const title = document.getElementById('journalTitle')?.value;
        const content = document.getElementById('journalContent')?.value;
        if (title || content) {
            return true;
        }
    }
    return false;
}

/**
 * Close All Modals
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
}

/**
 * Show Loading Overlay
 */
export function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
}

/**
 * Hide Loading Overlay
 */
export function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.hidden = true;
        document.body.style.overflow = '';
    }
}

/**
 * Show Message
 */
export function showMessage(message, type = 'info') {
    // Remove existing messages
    document.querySelectorAll('.message').forEach(el => el.remove());
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.innerHTML = `
        <span class="message-icon" aria-hidden="true">
            ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span class="message-text">${message}</span>
        <button class="message-close" aria-label="Dismiss">&times;</button>
    `;
    
    document.body.appendChild(messageElement);
    
    // Handle close button
    messageElement.querySelector('.message-close').addEventListener('click', () => {
        messageElement.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
}

/**
 * Utility Functions
 */

/**
 * Debounce function
 */
export function debounce(func, wait) {
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

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format date to readable string
 */
export function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get query parameter
 */
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Make functions globally available
window.showMessage = showMessage;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

