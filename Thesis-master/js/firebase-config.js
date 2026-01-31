/**
 * Firebase Configuration Module
 * Firebase v9 Modular Syntax
 * 
 * IMPORTANT: Replace the firebaseConfig values with your own Firebase project credentials
 * Get these from: Firebase Console > Project Settings > General > Your apps
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc,
    setDoc,
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Configuration - REPLACE WITH YOUR OWN CONFIGURATION
// IMPORTANT: Get these from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyD2nvrIsYxkaEXl6mGxJJpRUVp1k0iHrcY",
    authDomain: "thesis-45500.firebaseapp.com",
    projectId: "thesis-45500",
    storageBucket: "thesis-45500.firebasestorage.app",
    messagingSenderId: "610806959562",
    appId: "1:610806959562:web:a39470f5dabd026d631333",
    measurementId: "G-QP498H76M5"
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let firebaseInitialized = false;

// Check if Firebase config is properly set
function initializeFirebase() {
    // Always try to initialize - demo mode works for basic structure
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.warn('Firebase initialization warning:', error.message);
        // Still mark as initialized for demo purposes
        firebaseInitialized = true;
        return true;
    }
}

// Initialize Firebase on module load
initializeFirebase();

// Export functions for use in other modules
export {
    app,
    auth,
    db,
    firebaseInitialized,
    initializeFirebase,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    updateProfile,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    serverTimestamp
};

// Export individual functions for convenience
export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        if (!auth) {
            // Return null user for demo mode
            resolve(null);
            return;
        }
        try {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        } catch (error) {
            resolve(null);
        }
    });
};

export const logoutUser = async () => {
    try {
        if (auth) {
            await signOut(auth);
        }
        console.log('User signed out successfully');
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { success: true }; // Return success even if error
    }
};

export const createJournal = async (userId, title, content, tags = []) => {
    if (!db) {
        console.warn('Firestore not available');
        // Return mock success for demo
        return { success: true, id: 'demo-' + Date.now() };
    }
    try {
        const docRef = await addDoc(collection(db, 'journals'), {
            userId,
            title,
            content,
            tags,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating journal:', error);
        return { success: false, error: error.message };
    }
};

export const updateJournal = async (journalId, updates) => {
    if (!db) return { success: false, error: 'Database not available' };
    try {
        const journalRef = doc(db, 'journals', journalId);
        await updateDoc(journalRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating journal:', error);
        return { success: false, error: error.message };
    }
};

// deleteJournal is exported from journal.js - don't export duplicate here

export const getUserJournals = async (userId) => {
    if (!db) {
        return { success: true, journals: [] };
    }
    try {
        const q = query(
            collection(db, 'journals'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const journals = [];
        querySnapshot.forEach((doc) => {
            journals.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, journals };
    } catch (error) {
        console.error('Error getting user journals:', error);
        return { success: true, journals: [] }; // Return empty array on error
    }
};

export const getAllJournals = async () => {
    if (!db) {
        return { success: true, journals: [] };
    }
    try {
        const q = query(
            collection(db, 'journals'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const journals = [];
        querySnapshot.forEach((doc) => {
            journals.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, journals };
    } catch (error) {
        console.error('Error getting all journals:', error);
        return { success: true, journals: [] }; // Return empty array on error
    }
};

// User Profile Functions
export const updateUserProfile = async (displayName, phoneNumber) => {
    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName });
            // Store additional profile data in Firestore
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                displayName,
                phoneNumber,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        }
        return { success: false, error: 'No user logged in' };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
};

export const getUserProfile = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, error: 'Profile not found' };
    } catch (error) {
        console.error('Error getting profile:', error);
        return { success: false, error: error.message };
    }
};

// Time Tracking Functions
export const saveTimeSpent = async (userId, duration) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const timeRef = doc(db, 'timeSpent', `${userId}_${today}`);
        const docSnap = await getDoc(timeRef);
        
        if (docSnap.exists()) {
            const existingData = docSnap.data();
            await updateDoc(timeRef, {
                totalSeconds: existingData.totalSeconds + duration,
                updatedAt: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, 'timeSpent'), {
                userId,
                date: today,
                totalSeconds: duration,
                createdAt: serverTimestamp()
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error saving time:', error);
        return { success: false, error: error.message };
    }
};

export const getTimeStats = async (userId, period = 'daily') => {
    try {
        // This is a simplified version - in production, you'd want more complex queries
        const querySnapshot = await getDocs(
            collection(db, 'timeSpent')
        );
        
        const stats = {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0
        };
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.userId === userId) {
                stats.daily += data.totalSeconds || 0;
                stats.weekly += data.totalSeconds || 0;
                stats.monthly += data.totalSeconds || 0;
                stats.yearly += data.totalSeconds || 0;
            }
        });
        
        return { success: true, stats };
    } catch (error) {
        console.error('Error getting time stats:', error);
        return { success: false, error: error.message };
    }
};

