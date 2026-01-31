# Authentication Fix Plan

## Issues Identified:
1. Inconsistent auth state handling across pages
2. Navbar elements display inconsistently
3. Logout doesn't properly clear state
4. Missing `db` import in auth.html and index.html
5. No localStorage sync for faster UI updates
6. Race conditions between multiple auth handlers

## Fix Steps:

### Step 1: Fix js/auth.js
- Add centralized auth state management
- Sync auth state with localStorage
- Add consistent UI update functions
- Fix logout to properly clear state

### Step 2: Fix js/firebase-config.js
- Ensure proper exports including `db`

### Step 3: Fix auth.html
- Add proper `db` import
- Use centralized auth state handling
- Fix redirect logic to avoid infinite loops

### Step 4: Fix index.html
- Add proper `db` import
- Use centralized auth state handling
- Fix navbar display

### Step 5: Fix journal.html
- Use centralized auth state handling
- Fix navbar display
- Ensure consistent behavior

### Step 6: Fix profile.html
- Use centralized auth state handling
- Fix navbar display
- Ensure proper auth check

## Progress:
- [x] Step 1: Fix js/auth.js - Added centralized auth state management
- [x] Step 2: Fix js/firebase-config.js - Already properly exported
- [x] Step 3: Fix auth.html - Added db import and centralized auth handling
- [x] Step 4: Fix index.html - Added centralized auth handling
- [x] Step 5: Fix journal.html - Added centralized auth handling
- [x] Step 6: Fix profile.html - Added centralized auth handling

## Summary of Changes:
1. **js/auth.js**: Added centralized auth state management with:
   - `initAuthState()` - Initializes centralized auth state listener
   - `initAuthUI()` - Fast initial UI render from localStorage
   - `addAuthStateListener()` - Centralized listener system
   - `getCurrentUser()` - Synchronous user access
   - `isUserLoggedIn()` - Quick localStorage check
   - Auto sync with localStorage for faster UI updates

2. **auth.html**: 
   - Added proper `db` import
   - Uses centralized auth state handling
   - Fixed redirect logic with `authCheckComplete` flag to prevent infinite loops

3. **index.html**:
   - Added `db` import
   - Uses centralized auth state handling
   - Consistent navbar display

4. **journal.html**:
   - Uses centralized auth state handling
   - Consistent UI updates for all auth states
   - Fixed logout button event listener

5. **profile.html**:
   - Uses centralized auth state handling
   - Added `db` import
   - Fixed logout button event listener

