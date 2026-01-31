# Journal/Blog Website

A comprehensive, accessible, and feature-rich journal/blog website built with HTML5, CSS3, Vanilla JavaScript, and Firebase (Authentication + Firestore).

## 🚀 Features

### Authentication
- **Email/Password Login** - Traditional sign-in with email and password
- **Sign Up** - Create account with name, email, phone number, and password
- **Google Sign-In** - Quick login with Google account
- **Guest Mode** - Anonymous authentication for trying the platform
- **Password Strength Indicator** - Visual feedback on password security
- **CAPTCHA** - Visual and audio CAPTCHA for form validation
- **Biometric Login** - Fingerprint/face recognition using WebAuthn API

### Home Module
- Display journals/blogs from all users
- Fetch data from Firestore in real-time
- Sort by latest posts first
- Search functionality
- Filter options

### Profile Module (CRUD Operations)
- Create new journals/blogs
- Edit existing journals
- Delete journals
- Store journals in Firestore with user ID
- Access control (users can only edit/delete their own journals)

### Accessibility Features
- **Text-to-Speech (TTS)** - Web Speech API for reading content aloud
- **Color Blind Mode** - Grayscale filter for color blind users
- **Dyslexia-Friendly Mode** - OpenDyslexic font for better readability
- **Translator** - Multi-language support with RTL support (Arabic, Hebrew, etc.)
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - ARIA labels and roles

### Additional Modules
- **Time Spent Tracker** - Track daily, weekly, monthly, and yearly usage
- **Network Status Indicator** - Online/offline status with connection quality
- **Progressive Auto-Save** - Auto-save drafts every 5 seconds
- **Draft Recovery** - Recover unsaved work on page reload

## 📁 Project Structure

```
Thesis project/
├── index.html              # Landing page
├── auth.html               # Authentication page (login/signup)
├── home.html               # Home page (view all journals)
├── profile.html            # User profile (CRUD operations)
├── css/
│   └── styles.css          # Complete stylesheet
└── js/
    ├── firebase-config.js  # Firebase configuration & functions
    ├── auth.js             # Authentication module
    ├── accessibility.js    # Accessibility features
    ├── journal.js          # Journal CRUD operations
    ├── tracker.js          # Time tracking module
    ├── draft.js            # Auto-save & draft recovery
    ├── network.js          # Network status monitoring
    └── app.js              # Main application entry
```

## 🔧 Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication**:
   - Email/Password
   - Google
   - Anonymous
4. Enable **Firestore Database**:
   - Create database in test mode (for development)
   - Set appropriate security rules

### 2. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings**
2. Scroll to **Your apps** section
3. Click the web icon (</>) to register app
4. Copy the `firebaseConfig` object

### 3. Configure the Application

Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Firestore Security Rules

For development, use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read journals
    match /journals/{journalId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow users to manage their own data
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Time tracking collection
    match /timeSpent/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run the Application

Since this is a client-side application, you can:

**Option A: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` and select "Open with Live Server"

**Option B: Using Python**
```bash
cd Thesis project
python -m http.server 8000
```

**Option C: Using Node.js http-server**
```bash
cd Thesis project
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## 📋 Browser Requirements

- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript Enabled**: Required for all functionality
- **WebAuthn Support**: Required for biometric login (Chrome, Firefox, Edge)
- **Web Speech API**: Required for text-to-speech (most modern browsers)

### Browser Limitations

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebAuthn | ✅ Full | ✅ Full | ✅ (Mac/iOS) | ✅ Full |
| Web Speech API | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |

## 🎨 Accessibility Features

### Text-to-Speech
- Click on elements with `data-tts` attribute to hear them read aloud
- Toggle in accessibility panel

### Color Blind Mode
- Converts entire site to grayscale
- Toggle in accessibility panel

### Dyslexia-Friendly Mode
- Applies OpenDyslexic font
- Increases letter and word spacing
- Toggle in accessibility panel

### Multi-language Support
- Supports 10+ languages
- RTL support for Arabic, Hebrew, Persian, Urdu
- Toggle in accessibility panel

## 🔐 Security Notes

1. **Firebase Rules**: Always use appropriate security rules in production
2. **API Keys**: Firebase API keys are safe to use in client-side code
3. **Authentication**: All authentication is handled by Firebase
4. **Data Validation**: Input validation is performed on both client and server

## 🐛 Troubleshooting

### Firebase Not Initializing
- Check that you've replaced the placeholder API key
- Ensure Firebase scripts are loading correctly
- Check browser console for errors

### Authentication Errors
- Verify Authentication methods are enabled in Firebase Console
- Check email/password complexity requirements
- Ensure email verification is not required (if using anonymous auth)

### Firestore Errors
- Check Firestore is enabled
- Verify security rules allow the operation
- Check for proper indexes (some queries may require composite indexes)

### WebAuthn Not Working
- Ensure you're using HTTPS (required for WebAuthn)
- Check browser supports WebAuthn
- Verify biometric hardware is set up on device

## 🧪 Testing Instructions

### How to Test Each Feature

---

## 1. 🔐 Fingerprint/Biometric Login Testing

**Requirements:**
- Chrome, Firefox, or Edge browser
- Device with fingerprint sensor or Windows Hello
- **HTTPS or localhost** (required for WebAuthn)

**Steps to Test:**
1. Open the website (ensure HTTPS or localhost)
2. Go to Authentication page (`auth.html`)
3. Click **"Fingerprint Login"** button
4. Browser will prompt for biometric verification
5. Use your fingerprint or face recognition to authenticate
6. After verification, you'll be logged in via Anonymous Auth

**If Biometric Not Available:**
- The feature will show an error message
- Use alternative login methods (Email, Google, Guest)

**Browser Limitations:**
| Browser | Biometric Support |
|---------|------------------|
| Chrome | ✅ Windows Hello, Touch ID |
| Edge | ✅ Windows Hello |
| Firefox | ✅ Windows Hello, Touch ID |
| Safari | ✅ Touch ID (Mac) |

---

## 2. 🔊 Text-to-Speech (TTS) Testing

**Steps:**
1. Open any page with content
2. Click the **♿ Accessibility button** (bottom-right corner)
3. Toggle **"Text-to-Speech"** on
4. Click on any text element with the speaker icon 🔊
5. The content will be read aloud

**Browser Support:**
- Chrome, Firefox, Safari, Edge all support Web Speech API

---

## 3. 🎨 Color Blind Mode Testing

**Steps:**
1. Open the website
2. Click the **♿ Accessibility button** (bottom-right)
3. Toggle **"Color Blind Mode"** on
4. Entire website will convert to grayscale
5. Toggle off to return to normal colors

---

## 4. 📖 Dyslexia-Friendly Mode Testing

**Steps:**
1. Open the website
2. Click the **♿ Accessibility button** (bottom-right)
3. Toggle **"Dyslexia-Friendly Font"** on
4. Website will use OpenDyslexic-style font
5. Letter and word spacing will increase for readability

---

## 5. 🌐 Translator Testing (with RTL Support)

**Steps:**
1. Open the website
2. Click the **♿ Accessibility button** (bottom-right)
3. Select a language from the dropdown:
   - English, Español, Français, Deutsch
   - 中文 (Chinese), 日本語 (Japanese)
   - العربية (Arabic), हिन्दी (Hindi), Português (Portuguese)
4. Page content will be translated
5. For RTL languages (Arabic, Hebrew):
   - Page layout will flip (right-to-left)
   - Text will align to the right

---

## 6. ⌨️ Keyboard Navigation Testing

**Steps:**
1. Press `Tab` to navigate through links and buttons
2. Press `Enter` to activate buttons/links
3. Press `Escape` to close modals
4. Use arrow keys in forms
5. Focus states will be visible (outlined)

---

## 7. 🖥️ Screen Reader Testing

**Features Included:**
- ARIA labels on all interactive elements
- `aria-live` regions for dynamic content
- `role` attributes for proper semantics

**Testing with NVDA (Windows):**
1. Press `Ctrl + Alt + N` to start NVDA
2. Navigate through the page

**Testing with VoiceOver (Mac):**
1. Press `Cmd + F5` to start VoiceOver

---

## 8. ⏱️ Time Spent Tracker Testing

**Steps:**
1. Login to the website
2. Time tracker appears on profile page
3. Timer counts up in real-time
4. Stats show daily, weekly, monthly, yearly usage

---

## 9. 📡 Network Status Indicator Testing

**To Test Online Status:**
1. Open website - indicator shows connection status
2. Green 🟢 = Good connection
3. Yellow 🟡 = Fair connection
4. Orange 🟠 = Weak connection
5. Red 🔴 = Offline

**To Test Offline Mode:**
1. Open Chrome DevTools (`F12`)
2. Go to Network tab
3. Select "Offline" from throttling dropdown

---

## 10. 💾 Auto-Save Drafts Testing

**Steps:**
1. Go to Profile page
2. Click "Create New Journal"
3. Start typing in title/content
4. Wait 5 seconds - "Draft saved" message appears
5. Refresh the page - content is automatically restored

---

## 11. 🔒 CAPTCHA Testing

**Visual CAPTCHA:**
1. Go to Sign Up form
2. CAPTCHA appears below password field
3. Click refresh button to generate new CAPTCHA
4. Enter the characters shown

**Audio CAPTCHA:**
1. Click speaker icon 🔊 next to refresh button
2. Numbers are spoken aloud
3. Enter what you hear

---

## 12. 📱 Responsive Design Testing

**To Test:**
1. Open Chrome DevTools (`F12`)
2. Click device toggle icon (Ctrl+Shift+M)
3. Test various screen sizes (Desktop, Tablet, Mobile)

---

## 📋 Pre-Testing Checklist

- [ ] Firebase project created and configured
- [ ] Authentication methods enabled
- [ ] Firestore database created
- [ ] Browser updated to latest version
- [ ] JavaScript enabled
- [ ] For biometric: HTTPS or localhost used

## 📝 Academic Project Notes

This project was developed as an academic project with focus on:

1. **Accessibility Compliance**: WCAG 2.1 guidelines
2. **Clean Code**: Well-commented, modular architecture
3. **Best Practices**: Modern JavaScript patterns, Firebase v9 modular syntax
4. **User Experience**: Intuitive UI, progressive enhancement
5. **Error Handling**: Comprehensive error handling and user feedback

## 📄 License

This project is for educational purposes. Feel free to use and modify for learning.

## 🤝 Contributing

As this is an academic project, contributions should align with the educational goals. Focus on:
- Accessibility improvements
- Code documentation
- Performance optimization
- Bug fixes

## 📞 Support

For questions about setup or functionality, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)

