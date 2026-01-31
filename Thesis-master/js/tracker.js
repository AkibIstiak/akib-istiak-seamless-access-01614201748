/**
 * Time Tracking Module
 * Tracks user time spent on the website
 * 
 * Features:
 * - Track daily, weekly, monthly, yearly usage
 * - Store data in Firestore or localStorage (fallback)
 * - Display statistics
 * - Real-time tracking with periodic saves
 * - Persist cumulative totals across sessions
 */

// Import from firebase-config
import {
    auth,
    onAuthStateChanged,
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    serverTimestamp,
    firebaseInitialized
} from './firebase-config.js';

// Time tracking state
let trackingInterval = null;
let totalTrackedSeconds = 0;
let currentSessionSeconds = 0;
let isTracking = false;
let statsInterval = null;
let sessionStartTime = null;
let lastSaveTime = null;
let currentUserId = null;

// DOM Elements
let timeTrackerDisplay = null;
let statsContainer = null;

// LocalStorage keys
const STORAGE_KEYS = {
    SESSION_START: 'tracker_session_start',
    SESSION_PENDING: 'tracker_pending_seconds',
    TIME_STATS: 'tracker_time_stats'
};

// Initialize Time Tracking
export function initTimeTracker(displayId = 'time-display', statsId = 'time-stats') {
    console.log('Initializing time tracker...');
    
    // Get DOM elements
    timeTrackerDisplay = document.getElementById(displayId);
    statsContainer = document.getElementById(statsId);
    
    // Setup authentication listener
    setupAuthListener();
    
    // Setup visibility change listener (track when tab is active)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Setup beforeunload listener
    window.addEventListener('beforeunload', saveCurrentSession);
    
    console.log('Time tracker initialized successfully');
}

/**
 * Setup Authentication State Listener
 */
function setupAuthListener() {
    try {
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'logged in' : 'logged out');
            
            if (user) {
                // User is logged in
                currentUserId = user.uid;
                console.log('Starting time tracking for user:', user.uid);
                
                // Restore session from localStorage
                restoreSession();
                
                // Start tracking
                startTracking();
                
                // Load cumulative time stats
                // Small delay to ensure auth is fully ready
                setTimeout(async () => {
                    await loadTimeStats();
                }, 100);
            } else {
                // User is logged out
                console.log('User logged out - stopping tracking');
                currentUserId = null;
                stopTracking();
                resetDisplay();
            }
        });
    } catch (error) {
        console.error('Error setting up auth listener:', error);
    }
}

/**
 * Restore session from localStorage (for current session timer)
 */
function restoreSession() {
    const storedStartTime = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    const pendingSeconds = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_PENDING) || '0');
    
    if (storedStartTime) {
        // Calculate elapsed time since last page load
        const elapsed = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000);
        currentSessionSeconds = pendingSeconds + elapsed;
        sessionStartTime = parseInt(storedStartTime);
        lastSaveTime = sessionStartTime;
        console.log('Session restored - elapsed:', elapsed, 'seconds, pending:', pendingSeconds, 'current session:', currentSessionSeconds);
    } else {
        // New session - start fresh timer
        currentSessionSeconds = 0;
        sessionStartTime = Date.now();
        lastSaveTime = sessionStartTime;
        localStorage.setItem(STORAGE_KEYS.SESSION_START, sessionStartTime.toString());
        console.log('New session started - timer at 0:00');
    }
}

/**
 * Save pending session time to localStorage (before page unload)
 */
function savePendingSession() {
    if (sessionStartTime) {
        localStorage.setItem(STORAGE_KEYS.SESSION_START, sessionStartTime.toString());
        localStorage.setItem(STORAGE_KEYS.SESSION_PENDING, currentSessionSeconds.toString());
    }
}

/**
 * Save time stats to localStorage (fallback when Firestore not available)
 * This saves the FULL current session time, not just the delta
 */
function saveTimeStatsToLocalStorage(sessionTotalSeconds) {
    if (!currentUserId) return;
    
    try {
        const storageKey = STORAGE_KEYS.TIME_STATS + '_' + currentUserId;
        const storedStats = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        // We add the full sessionTotalSeconds to accumulate properly
        const addAmount = sessionTotalSeconds;
        
        // Update stored stats (accumulate)
        const newStats = {
            daily: (storedStats.daily || 0) + addAmount,
            weekly: (storedStats.weekly || 0) + addAmount,
            monthly: (storedStats.monthly || 0) + addAmount,
            yearly: (storedStats.yearly || 0) + addAmount,
            total: (storedStats.total || 0) + addAmount,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(newStats));
        console.log('Stats saved to localStorage - Added:', addAmount, 'seconds, New total:', newStats.total);
    } catch (error) {
        console.error('Error saving stats to localStorage:', error);
    }
}

/**
 * Load time stats from localStorage (fallback when Firestore not available)
 */
function loadTimeStatsFromLocalStorage() {
    if (!currentUserId) return null;
    
    try {
        const storageKey = STORAGE_KEYS.TIME_STATS + '_' + currentUserId;
        const storedStats = localStorage.getItem(storageKey);
        
        if (storedStats) {
            const stats = JSON.parse(storedStats);
            console.log('Stats loaded from localStorage:', stats);
            return stats;
        }
    } catch (error) {
        console.error('Error loading stats from localStorage:', error);
    }
    
    return null;
}

/**
 * Start Time Tracking
 */
function startTracking() {
    if (isTracking) return;
    
    isTracking = true;
    
    // Initialize session start time if not set
    if (!sessionStartTime) {
        sessionStartTime = Date.now();
        lastSaveTime = sessionStartTime;
        localStorage.setItem(STORAGE_KEYS.SESSION_START, sessionStartTime.toString());
    }
    
    console.log('Time tracking started, current session:', currentSessionSeconds, 'seconds');
    
    // Update display every second
    trackingInterval = setInterval(updateTimeDisplay, 1000);
    
    // Save to storage every 30 seconds
    statsInterval = setInterval(saveCurrentSession, 30000);
    
    // Update stats display every 5 seconds
    if (statsContainer) {
        setInterval(updateStatsDisplay, 5000);
    }
}

/**
 * Stop Time Tracking
 */
function stopTracking() {
    if (!isTracking) return;
    
    isTracking = false;
    
    // Save session to storage before stopping
    saveCurrentSession();
    
    // Save pending to localStorage
    savePendingSession();
    
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
    
    console.log('Time tracking stopped, current session:', currentSessionSeconds, 'seconds');
}

/**
 * Handle Tab Visibility Change
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // Tab is hidden, save pending time
        savePendingSession();
    } else {
        // Tab is visible, resume tracking
        if (auth && auth.currentUser) {
            startTracking();
        }
    }
}

/**
 * Update Time Display (current session timer)
 */
function updateTimeDisplay() {
    if (!sessionStartTime) return;
    
    // Calculate total session time including elapsed
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    currentSessionSeconds = elapsed;
    totalTrackedSeconds = currentSessionSeconds;
    
    if (timeTrackerDisplay) {
        timeTrackerDisplay.textContent = formatTime(currentSessionSeconds);
    }
    
    // Also update stats cards in real-time
    const stats = loadTimeStatsFromLocalStorage() || {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0
    };
    displayTimeStats(stats);
}

/**
 * Reset Display (for logout - resets current session timer only)
 */
function resetDisplay() {
    if (timeTrackerDisplay) {
        timeTrackerDisplay.textContent = '0:00';
    }
    // Reset current session timer to 0, but stats are preserved in storage
    currentSessionSeconds = 0;
    sessionStartTime = null;
    lastSaveTime = null;
    totalTrackedSeconds = 0;
}

/**
 * Save Current Session to Storage
 * Accumulates time properly across sessions
 */
async function saveCurrentSession() {
    if (!auth || !auth.currentUser || !isTracking) return;
    
    const userId = auth.currentUser.uid;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate duration since last save (or session start)
    const now = Date.now();
    const timeSinceLastSave = lastSaveTime ? Math.floor((now - lastSaveTime) / 1000) : 0;
    
    if (timeSinceLastSave < 5) {
        return;
    }
    
    const duration = timeSinceLastSave;
    
    // Create stats object for this save
    const sessionStats = {
        daily: duration,
        weekly: duration,
        monthly: duration,
        yearly: duration,
        total: duration
    };
    
    // Try Firestore first, fallback to localStorage
    try {
        if (firebaseInitialized && db) {
            // Save to Firestore
            const timeRef = doc(db, 'timeSpent', userId + '_' + today);
            const docSnap = await getDoc(timeRef);
            
            let existingTotal = 0;
            if (docSnap.exists()) {
                existingTotal = docSnap.data().totalSeconds || 0;
            }
            
            const newTotal = existingTotal + duration;
            
            if (docSnap.exists()) {
                await updateDoc(timeRef, {
                    totalSeconds: newTotal,
                    updatedAt: serverTimestamp()
                });
            } else {
                await setDoc(timeRef, {
                    userId: userId,
                    date: today,
                    totalSeconds: duration,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            
            console.log('Time saved to Firestore - Duration:', duration, 'seconds, Total today:', newTotal);
        } else {
            // Fallback to localStorage - save full current session time
            console.log('Saving full session time to localStorage:', currentSessionSeconds, 'seconds');
            saveTimeStatsToLocalStorage(currentSessionSeconds);
        }
    } catch (error) {
        console.error('Error saving time, using localStorage:', error);
        saveTimeStatsToLocalStorage(currentSessionSeconds);
    }
    
    // Update last save time
    lastSaveTime = now;
}

/**
 * Load Time Statistics from Storage
 * Loads cumulative totals from Firestore or localStorage
 */
async function loadTimeStats() {
    if (!auth || !auth.currentUser) {
        console.log('No user, skipping time stats load');
        return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('Loading time stats for user:', userId);
    
    const stats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0
    };
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    try {
        // Try Firestore first
        if (firebaseInitialized && db) {
            const querySnapshot = await getDocs(collection(db, 'timeSpent'));
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.userId !== userId) return;
                
                const entryDate = new Date(data.date);
                const seconds = data.totalSeconds || 0;
                
                stats.total += seconds;
                
                if (entryDate >= weekAgo) stats.weekly += seconds;
                if (entryDate >= monthAgo) stats.monthly += seconds;
                if (entryDate >= yearAgo) stats.yearly += seconds;
                
                if (data.date === today) {
                    stats.daily += seconds;
                }
            });
            
            console.log('Time stats loaded from Firestore');
        } else {
            // Fallback to localStorage
            console.log('Firebase not available, loading from localStorage');
            const localStats = loadTimeStatsFromLocalStorage();
            if (localStats) {
                stats.daily = localStats.daily || 0;
                stats.weekly = localStats.weekly || 0;
                stats.monthly = localStats.monthly || 0;
                stats.yearly = localStats.yearly || 0;
                stats.total = localStats.total || 0;
                console.log('Stats loaded from localStorage:', stats);
            }
        }
    } catch (error) {
        console.error('Error loading time stats:', error);
        // Try localStorage as fallback
        const localStats = loadTimeStatsFromLocalStorage();
        if (localStats) {
            stats.daily = localStats.daily || 0;
            stats.weekly = localStats.weekly || 0;
            stats.monthly = localStats.monthly || 0;
            stats.yearly = localStats.yearly || 0;
            stats.total = localStats.total || 0;
        }
    }
    
    console.log('Final stats to display:', stats);
    displayTimeStats(stats);
}

/**
 * Update Stats Display Periodically
 */
function updateStatsDisplay() {
    loadTimeStats();
}

/**
 * Display Time Statistics
 * Shows cumulative stats + current session time
 */
function displayTimeStats(stats) {
    const todayElement = document.getElementById('today-time');
    const weekElement = document.getElementById('week-time');
    const totalElement = document.getElementById('total-time');

    // Add current session time to cumulative stats
    const todayTotal = (stats.daily || 0) + currentSessionSeconds;
    const weekTotal = (stats.weekly || 0) + currentSessionSeconds;
    const totalAll = (stats.total || 0) + currentSessionSeconds;

    if (todayElement) {
        todayElement.textContent = formatTimeLong(todayTotal);
        // Add TTS attribute for accessibility with proper words
        todayElement.setAttribute('data-tts', `Time spent today: ${formatTimeLongForTTS(todayTotal)}`);
    }
    if (weekElement) {
        weekElement.textContent = formatTimeLong(weekTotal);
        // Add TTS attribute for accessibility with proper words
        weekElement.setAttribute('data-tts', `Time spent this week: ${formatTimeLongForTTS(weekTotal)}`);
    }
    if (totalElement) {
        totalElement.textContent = formatTimeLong(totalAll);
        // Add TTS attribute for accessibility with proper words
        totalElement.setAttribute('data-tts', `Total time spent: ${formatTimeLongForTTS(totalAll)}`);
    }

    console.log('Displayed stats - Today:', formatTimeLong(todayTotal), 'Week:', formatTimeLong(weekTotal), 'Total:', formatTimeLong(totalAll));
}

/**
 * Format Time from Seconds to Human Readable (H:M:S)
 */
function formatTime(totalSeconds) {
    if (!totalSeconds || totalSeconds < 0) return '0:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return hours + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    }
    return minutes + ':' + seconds.toString().padStart(2, '0');
}

/**
 * Format Time as Long Text (X hours Y minutes)
 */
function formatTimeLong(totalSeconds) {
    if (!totalSeconds || totalSeconds < 0) return '0m';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return hours + 'h ' + minutes + 'm';
    }
    return minutes + 'm';
}

/**
 * Format Time for TTS (X hours Y minutes) - speaks full words
 */
function formatTimeLongForTTS(totalSeconds) {
    if (!totalSeconds || totalSeconds < 0) return '0 minutes';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        if (minutes > 0) {
            return hours + ' hours ' + minutes + ' minutes';
        }
        return hours + ' hours';
    }
    return minutes + ' minutes';
}

/**
 * Get Current Session Time
 */
export function getCurrentSessionTime() {
    return currentSessionSeconds;
}

/**
 * Get Total Tracked Time
 */
export function getTotalTrackedTime() {
    return totalTrackedSeconds;
}

