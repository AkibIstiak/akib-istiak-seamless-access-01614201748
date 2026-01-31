/**
 * Draft Module
 * Handles progressive auto-save and draft recovery
 * 
 * Features:
 * - Auto-save blog/journal drafts every few seconds
 * - Recover drafts on page reload
 * - Store drafts in localStorage
 * - Clear drafts when saved successfully
 */

// DOM Elements
let draftForm;
let draftStatusIndicator;

// Configuration
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_KEY = 'journal_drafts';

// Initialize Draft Module
export function initDraft(formId = 'journalForm', statusId = 'draft-status') {
    draftForm = document.getElementById(formId);
    draftStatusIndicator = document.getElementById(statusId);
    
    if (draftForm) {
        // Setup form inputs for auto-save
        const inputs = draftForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => saveDraft(), 1000));
        });
        
        // Setup form submission to clear draft
        draftForm.addEventListener('submit', clearDraft);
        
        // Recover draft on load
        recoverDraft();
        
        // Start auto-save interval
        startAutoSave();
        
        console.log('Draft module initialized');
    }
}

/**
 * Save Draft to localStorage
 */
function saveDraft() {
    if (!draftForm) return;
    
    const formData = new FormData(draftForm);
    const draftData = {
        title: document.getElementById('journalTitle')?.value || '',
        content: document.getElementById('journalContent')?.value || '',
        tags: document.getElementById('journalTags')?.value || '',
        journalId: document.getElementById('journalId')?.value || '',
        savedAt: Date.now()
    };
    
    // Don't save empty drafts
    if (!draftData.title && !draftData.content) {
        return;
    }
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
        updateDraftStatus('Draft saved', 'success');
        console.log('Draft saved at:', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Error saving draft:', error);
        updateDraftStatus('Error saving draft', 'error');
    }
}

/**
 * Recover Draft from localStorage
 */
function recoverDraft() {
    try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        
        if (!savedDraft) {
            console.log('No draft to recover');
            return;
        }
        
        const draft = JSON.parse(savedDraft);
        
        // Check if draft is not too old
        const age = Date.now() - (draft.savedAt || 0);
        if (age > MAX_DRAFT_AGE) {
            console.log('Draft is too old, clearing');
            clearDraft();
            return;
        }
        
        // Populate form
        const titleInput = document.getElementById('journalTitle');
        const contentInput = document.getElementById('journalContent');
        const tagsInput = document.getElementById('journalTags');
        const journalIdInput = document.getElementById('journalId');
        
        let hasContent = false;
        
        if (titleInput && draft.title) {
            titleInput.value = draft.title;
            hasContent = true;
        }
        if (contentInput && draft.content) {
            contentInput.value = draft.content;
            hasContent = true;
        }
        if (tagsInput && draft.tags) {
            tagsInput.value = draft.tags;
        }
        if (journalIdInput && draft.journalId) {
            journalIdInput.value = draft.journalId;
        }
        
        if (hasContent) {
            const recoveryTime = new Date(draft.savedAt).toLocaleString();
            updateDraftStatus(`Draft recovered from ${recoveryTime}`, 'info');
            console.log('Draft recovered successfully');
            
            // Ask user if they want to restore the draft
            setTimeout(() => {
                if (confirm('We found a saved draft. Would you like to restore it?')) {
                    // Draft is already restored above
                    showMessage('Draft restored!', 'success');
                } else {
                    clearDraft();
                }
            }, 500);
        }
        
    } catch (error) {
        console.error('Error recovering draft:', error);
    }
}

/**
 * Clear Draft from localStorage
 */
function clearDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        updateDraftStatus('Draft cleared', 'info');
        console.log('Draft cleared');
    } catch (error) {
        console.error('Error clearing draft:', error);
    }
}

/**
 * Start Auto-Save Interval
 */
function startAutoSave() {
    setInterval(() => {
        saveDraft();
    }, AUTO_SAVE_INTERVAL);
}

/**
 * Update Draft Status Indicator
 */
function updateDraftStatus(message, type = 'info') {
    if (draftStatusIndicator) {
        draftStatusIndicator.textContent = message;
        draftStatusIndicator.className = `draft-status ${type}`;
        draftStatusIndicator.setAttribute('role', 'status');
        
        // Auto-hide after 3 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                draftStatusIndicator.textContent = '';
                draftStatusIndicator.className = 'draft-status';
            }, 3000);
        }
    }
}

/**
 * Get Draft Data
 */
export function getDraftData() {
    try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            return JSON.parse(savedDraft);
        }
    } catch (error) {
        console.error('Error getting draft data:', error);
    }
    return null;
}

/**
 * Has Draft
 */
export function hasDraft() {
    const draft = getDraftData();
    return draft && (draft.title || draft.content);
}

/**
 * Debounce Helper Function
 */
function debounce(func, wait) {
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
 * Show Message Helper
 */
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.textContent = message;
    
    document.querySelectorAll('.message').forEach(el => el.remove());
    document.body.appendChild(messageElement);
    
    setTimeout(() => messageElement.remove(), 5000);
}

// Export functions
export {
    saveDraft,
    recoverDraft,
    clearDraft,
    getDraftData,
    hasDraft
};

