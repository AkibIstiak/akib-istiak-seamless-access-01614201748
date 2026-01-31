
/**
 * Accessibility Module
 * Provides comprehensive accessibility features for the Journal/Blog website
 * 
 * Features:
 * - Text-to-Speech (TTS) using Web Speech API
 * - Color Blind Mode (grayscale)
 * - Dyslexia-Friendly Mode (OpenDyslexic font)
 * - Translator with RTL support
 */

// Global accessibility state
const accessibilityState = {
    ttsEnabled: false,
    colorBlindMode: false,
    dyslexiaMode: false,
    currentLanguage: 'en',
    isRTL: false,
    isSpeaking: false,
    currentSpeechId: 0
};

// DOM Elements
let ttsButton;
let colorBlindToggle;
let dyslexiaToggle;
let languageSelector;

// Initialize Accessibility Module
export function initAccessibility() {
    // Create accessibility controls UI
    createAccessibilityPanel();

    // Load saved preferences
    loadAccessibilityPreferences();

    // Setup event listeners
    setupAccessibilityListeners();

    // Setup TTS for elements with data-tts attribute
    setupTTS();

    // Make setupTTS available globally for other modules
    window.setupTTS = setupTTS;

    console.log('Accessibility module initialized');
}

// Export translatePage for use by other modules
export { translatePage };

// Make translatePage available globally for HTML scripts
window.translatePage = translatePage;

// Make accessibilityState globally available
window.accessibilityState = accessibilityState;

/**
 * Create Accessibility Control Panel
 */
function createAccessibilityPanel() {
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Accessibility Controls');
    
    panel.innerHTML = `
        <button id="accessibility-toggle" class="accessibility-toggle" aria-expanded="false" aria-controls="accessibility-menu">
            <span aria-hidden="true">♿</span>
            <span class="sr-only">Accessibility Options</span>
        </button>

        <div id="accessibility-menu" class="accessibility-menu" hidden>
            <div class="accessibility-menu-header">
                <h3>Accessibility Options</h3>
                <button id="close-accessibility-menu" class="close-btn" aria-label="Close accessibility menu">×</button>
            </div>

            <!-- Text-to-Speech -->
            <div class="accessibility-option">
                <label for="tts-toggle">
                    <input type="checkbox" id="tts-toggle" role="switch">
                    <span>Text-to-Speech</span>
                </label>
                <p class="option-description">Read content aloud on hover</p>
            </div>

            <!-- Color Blind Mode -->
            <div class="accessibility-option">
                <label for="colorblind-toggle">
                    <input type="checkbox" id="colorblind-toggle" role="switch">
                    <span>Color Blind Mode</span>
                </label>
                <p class="option-description">Convert site to grayscale</p>
            </div>

            <!-- Dyslexia-Friendly Mode -->
            <div class="accessibility-option">
                <label for="dyslexia-toggle">
                    <input type="checkbox" id="dyslexia-toggle" role="switch">
                    <span>Dyslexia-Friendly Font</span>
                </label>
                <p class="option-description">Use OpenDyslexic font for better readability</p>
            </div>

            <!-- Language Selector -->
            <div class="accessibility-option">
                <label for="language-select">Language</label>
                <select id="language-select" aria-describedby="language-help">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="bn">বাংলা</option>
                    <option value="hi">हिन्दी</option>
                    <option value="pt">Português</option>
                </select>
                <p id="language-help" class="option-description">Translate page content</p>
            </div>

            <!-- Reset Button -->
            <button id="reset-accessibility" class="reset-btn">Reset to Defaults</button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Get element references
    ttsButton = document.getElementById('tts-toggle');
    colorBlindToggle = document.getElementById('colorblind-toggle');
    dyslexiaToggle = document.getElementById('dyslexia-toggle');
    languageSelector = document.getElementById('language-select');
    
    // Toggle menu visibility
    document.getElementById('accessibility-toggle').addEventListener('click', () => {
        const menu = document.getElementById('accessibility-menu');
        const toggle = document.getElementById('accessibility-toggle');
        const isHidden = menu.hidden;
        
        menu.hidden = !isHidden;
        toggle.setAttribute('aria-expanded', isHidden);
    });

    // Prevent menu from closing when clicking inside it
    const menu = document.getElementById('accessibility-menu');
    if (menu) {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

/**
 * Setup Accessibility Event Listeners
 */
function setupAccessibilityListeners() {
    // Text-to-Speech Toggle
    if (ttsButton) {
        ttsButton.addEventListener('change', (e) => {
            accessibilityState.ttsEnabled = e.target.checked;
            saveAccessibilityPreferences();
            setupTTS();

            if (accessibilityState.ttsEnabled) {
                showMessage('Text-to-Speech enabled', 'success');
            } else {
                stopSpeech();
                showMessage('Text-to-Speech disabled', 'info');
            }
        });
    }
    
    // Color Blind Mode Toggle
    if (colorBlindToggle) {
        colorBlindToggle.addEventListener('change', (e) => {
            accessibilityState.colorBlindMode = e.target.checked;
            document.body.classList.toggle('colorblind-mode', accessibilityState.colorBlindMode);
            saveAccessibilityPreferences();

            if (accessibilityState.colorBlindMode) {
                showMessage('Color Blind Mode enabled - Grayscale applied', 'success');
            } else {
                showMessage('Color Blind Mode disabled', 'info');
            }
        });
    }
    
    // Dyslexia-Friendly Mode Toggle
    if (dyslexiaToggle) {
        dyslexiaToggle.addEventListener('change', (e) => {
            accessibilityState.dyslexiaMode = e.target.checked;
            document.body.classList.toggle('dyslexia-mode', accessibilityState.dyslexiaMode);
            saveAccessibilityPreferences();
            
            if (accessibilityState.dyslexiaMode) {
                showMessage('Dyslexia-Friendly Mode enabled - OpenDyslexic font applied', 'success');
            } else {
                showMessage('Dyslexia-Friendly Mode disabled', 'info');
            }
        });
    }
    
    // Language Selector
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            translatePage(selectedLang);
        });
    }
    
    // Close Button
    const closeBtn = document.getElementById('close-accessibility-menu');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const menu = document.getElementById('accessibility-menu');
            const toggle = document.getElementById('accessibility-toggle');
            menu.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    // Reset Button
    document.getElementById('reset-accessibility').addEventListener('click', () => {
        resetAccessibility();
    });
}

/**
 * Setup Text-to-Speech
 */
function setupTTS() {
    try {
        // Remove existing TTS handlers from all text elements
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, label, input, textarea, .journal-content, .journal-title, .journal-excerpt, .card, .btn').forEach(el => {
            el.onmouseenter = null;
            el.onmouseleave = null;
            el.classList.remove('tts-enabled');
        });

        // Also remove handlers from data-tts elements
        document.querySelectorAll('[data-tts]').forEach(el => {
            el.onmouseenter = null;
            el.onmouseleave = null;
            el.classList.remove('tts-enabled');
        });

        if (!accessibilityState.ttsEnabled) return;

        // Add TTS handlers to all headings and text elements
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, label, input, textarea, .journal-content, .journal-title, .card, .btn').forEach(el => {
            // Skip accessibility panel elements
            if (el.closest('#accessibility-panel')) return;

            // Skip elements that have data-tts attribute (they will be handled separately)
            if (el.hasAttribute('data-tts')) return;

            // Check if element has text content (different for inputs)
            let text = '';
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                text = el.placeholder || el.value || el.getAttribute('aria-label') || '';
            } else {
                text = el.textContent.trim();
            }
            if (!text) return;

            // Add event listeners
            el.onmouseenter = function() {
                if (accessibilityState.ttsEnabled && !accessibilityState.isSpeaking) {
                    let txt = '';
                    if (this.tagName === 'INPUT' || this.tagName === 'TEXTAREA') {
                        txt = this.placeholder || this.value || this.getAttribute('aria-label') || '';
                    } else {
                        txt = this.textContent.trim();
                    }
                    if (txt) speakText(txt);
                }
            };
            el.onmouseleave = function() {
                stopSpeech();
            };

            // Add visual indicator
            el.classList.add('tts-enabled');
        });

        // Also setup TTS for elements with data-tts attribute (journal content)
        document.querySelectorAll('[data-tts]').forEach(el => {
            // Skip if already has handlers
            if (el.onmouseenter) return;

            let leaveTimeout;
            let currentText = '';
            let ttsTimeout;

            el.onmouseenter = function() {
                // Clear any pending leave timeout
                if (leaveTimeout) {
                    clearTimeout(leaveTimeout);
                    leaveTimeout = null;
                }

                // Clear any pending TTS timeout
                if (ttsTimeout) {
                    clearTimeout(ttsTimeout);
                }

                if (accessibilityState.ttsEnabled) {
                    const txt = this.getAttribute('data-tts') || this.textContent.trim();
                    if (txt && txt !== currentText) {
                        currentText = txt;
                        // Stop any ongoing speech
                        stopSpeech();
                        // Start new speech after a delay
                        ttsTimeout = setTimeout(() => {
                            if (currentText === txt) {
                                speakText(txt);
                            }
                        }, 100);
                    }
                }
            };
            el.onmouseleave = function() {
                // Stop speech immediately
                stopSpeech();
                currentText = '';
                // Clear any pending TTS timeout
                if (ttsTimeout) {
                    clearTimeout(ttsTimeout);
                    ttsTimeout = null;
                }
            };

            // Add visual indicator
            el.classList.add('tts-enabled');
        });
    } catch (error) {
        console.error('Error setting up TTS:', error);
    }
}

// Export setupTTS for use by other modules
export { setupTTS };

/**
 * Speak text using Web Speech API - simple and reliable
 */
function speakText(text) {
    if (!window.speechSynthesis) {
        showMessage('Text-to-Speech is not supported in this browser.', 'warning');
        return;
    }

    // Increment speech ID to track current speech
    accessibilityState.currentSpeechId++;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Set speaking flag
    accessibilityState.isSpeaking = true;

    // Create utterance directly
    const utterance = new SpeechSynthesisUtterance(text);
    const speechId = accessibilityState.currentSpeechId;

    // Set language with better support for different languages
    let langCode = accessibilityState.currentLanguage;
    if (langCode === 'bn') {
        langCode = 'bn';
    }

    utterance.lang = langCode;
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Function to attempt speaking with fallback
    const attemptSpeak = () => {
        const voices = window.speechSynthesis.getVoices();

        // Special handling for Bengali
        if (langCode === 'bn') {
            const bengaliVoices = voices.filter(voice => voice.lang.startsWith('bn'));
            if (bengaliVoices.length > 0) {
                utterance.voice = bengaliVoices[0]; // Use the first available Bengali voice
                utterance.lang = 'bn';
            } else {
                // Fallback to English for Bengali text
                console.warn('No Bengali voices available. Falling back to English.');
                utterance.lang = 'en';
                showMessage('Bengali voices not available in this browser. Using English instead.', 'info');
            }
        } else {
            // Check if voices for the selected language are available
            const availableVoices = voices.filter(voice => voice.lang.startsWith(langCode));

            if (availableVoices.length === 0 && langCode !== 'en') {
                // Fallback to English if the language is not supported
                console.warn(`No voices available for language: ${langCode}. Falling back to English.`);
                utterance.lang = 'en';
                showMessage(`Text-to-Speech for ${getLanguageName(langCode)} is not available. Using English instead.`, 'info');
            }
        }

        // Add event listeners to reset speaking flag when speech ends
        utterance.onend = () => {
            if (accessibilityState.currentSpeechId === speechId) {
                accessibilityState.isSpeaking = false;
            }
        };
        utterance.onerror = () => {
            if (accessibilityState.currentSpeechId === speechId) {
                accessibilityState.isSpeaking = false;
            }
        };

        // Speak the utterance
        window.speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded before speaking
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        // Wait for voices to load
        window.speechSynthesis.addEventListener('voiceschanged', attemptSpeak, { once: true });
    } else {
        // Speak immediately
        attemptSpeak();
    }
}

/**
 * Get human-readable language name
 */
function getLanguageName(langCode) {
    const langNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'bn': 'Bengali',
        'hi': 'Hindi',
        'pt': 'Portuguese'
    };
    return langNames[langCode] || langCode;
}

/**
 * Stop speech synthesis
 */
function stopSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // Reset speaking flag when speech is stopped
    accessibilityState.isSpeaking = false;
}

/**
 * Helper function to show messages
 */
function showMessage(message, type) {
    type = type || 'info';
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-' + type;
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.textContent = message;
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(el => el.remove());
    
    document.body.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(function() {
        messageElement.remove();
    }, 5000);
}

/**
 * Save Accessibility Preferences to LocalStorage
 */
function saveAccessibilityPreferences() {
    try {
        localStorage.setItem('accessibility_preferences', JSON.stringify(accessibilityState));
    } catch (error) {
        console.warn('Could not save accessibility preferences:', error);
    }
}

/**
 * Load Accessibility Preferences from LocalStorage
 */
function loadAccessibilityPreferences() {
    // Accessibility settings are untoggled by default on page refresh
    // Do not load saved preferences to ensure they reset to off state
    try {
        // Load saved preferences from localStorage
        const saved = localStorage.getItem('accessibility_preferences');
        let savedPreferences = null;
        if (saved) {
            savedPreferences = JSON.parse(saved);
        }

        // Reset checkboxes to unchecked state
        if (ttsButton) ttsButton.checked = false;
        if (colorBlindToggle) colorBlindToggle.checked = false;
        if (dyslexiaToggle) dyslexiaToggle.checked = false;

        // Reset state to defaults
        accessibilityState.ttsEnabled = false;
        accessibilityState.colorBlindMode = false;
        accessibilityState.dyslexiaMode = false;
        accessibilityState.currentLanguage = savedPreferences?.currentLanguage || 'en';
        accessibilityState.isRTL = false;

        // Set language selector to saved language or default to 'en'
        if (languageSelector) languageSelector.value = accessibilityState.currentLanguage;

        // Remove any applied CSS classes
        document.body.classList.remove('colorblind-mode', 'dyslexia-mode', 'rtl-mode');
        document.body.style.direction = 'ltr';

        // Apply saved language or default to English
        translatePage(accessibilityState.currentLanguage);
    } catch (error) {
        console.warn('Could not reset accessibility preferences:', error);
    }
}

/**
 * Reset Accessibility to Defaults
 */
function resetAccessibility() {
    if (ttsButton) ttsButton.checked = false;
    if (colorBlindToggle) colorBlindToggle.checked = false;
    if (dyslexiaToggle) dyslexiaToggle.checked = false;
    if (languageSelector) languageSelector.value = 'en';

    document.body.classList.remove('colorblind-mode', 'dyslexia-mode', 'rtl-mode');
    document.body.style.direction = 'ltr';
    document.body.style.textAlign = 'left';

    accessibilityState.ttsEnabled = false;
    accessibilityState.colorBlindMode = false;
    accessibilityState.dyslexiaMode = false;
    accessibilityState.currentLanguage = 'en';
    accessibilityState.isRTL = false;

    // Remove all TTS handlers to prevent lingering event listeners
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, label, .journal-content, .journal-title, .journal-excerpt, .card, .btn').forEach(el => {
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.classList.remove('tts-enabled');
    });

    // Also remove handlers from data-tts elements
    document.querySelectorAll('[data-tts]').forEach(el => {
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.classList.remove('tts-enabled');
    });

    // Apply English translation to reset the page language
    translatePage('en');

    saveAccessibilityPreferences();
    stopSpeech();

    showMessage('Accessibility settings reset to defaults', 'success');
}

/**
 * Translations object containing text for all supported languages
 */
export const translations = {
    'en': {
        'Blog': 'Blog',
        'Journal/Blog': 'Journal',
        'Home': 'Home',
        'Journal': 'Journal',
        'Login': 'Login',
        'Logout': 'Logout',
        'Welcome to Blog': 'Welcome to Blog',
        'Share your stories, connect with writers, and discover new perspectives': 'Share your stories, connect with writers, and discover new perspectives',
        'Get Started': 'Get Started',
        'Browse Posts': 'Browse Posts',
        'Features': 'Features',
        'Easy Writing': 'Easy Writing',
        'Create and manage your journals with our intuitive editor': 'Create and manage your journals with our intuitive editor',
        'Multi-language Support': 'Multi-language Support',
        'Translate content and support RTL languages like Arabic': 'Translate content and support RTL languages like Arabic',
        'Accessibility First': 'Accessibility First',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'Text-to-speech, color blind mode, and dyslexia-friendly font',
        'Biometric Login': 'Biometric Login',
        'Secure fingerprint/face recognition login using WebAuthn': 'Secure fingerprint/face recognition login using WebAuthn',
        'Auto-Save Drafts': 'Auto-Save Drafts',
        'Never lose your work with automatic draft saving': 'Never lose your work with automatic draft saving',
        'Activity Tracking': 'Activity Tracking',
        'Track your time spent reading and writing': 'Track your time spent reading and writing',
        'How It Works': 'How It Works',
        'Create Account': 'Create Account',
        'Sign up with email, Google, or go anonymous': 'Sign up with email, Google, or go anonymous',
        'Write Blog': 'Write Blog',
        'Write Journal': 'Write Journal',
        'Share your thoughts with our easy-to-use editor': 'Share your thoughts with our easy-to-use editor',
        'Connect': 'Connect',
        'Engage with other writers and readers': 'Engage with other writers and readers',
        'Ready to Start Writing?': 'Ready to Start Writing?',
        'Join our community of writers and share your story with the world': 'Join our community of writers and share your story with the world',
        'Create Free Account': 'Create Free Account',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 Journal/Blog. All rights reserved.',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'Built with HTML, CSS, Vanilla JavaScript, and Firebase',
        // Journal page translations
        'Latest Posts': 'Latest Posts',
        'Discover articles from our community of writers': 'Discover articles from our community of writers',
        'Welcome back': 'Welcome back',
        'Great to have you here': 'Great to have you here',
        'Your Time on Site': 'Your Time on Site',
        'Create Journal': 'Create Journal',
        'Search journals...': 'Search journals...',
        'Most Recent': 'Most Recent',
        'Oldest First': 'Oldest First',
        'Most Popular': 'Most Popular',
        'No journals yet': 'No journals yet',
        'Be the first to share your thoughts!': 'Be the first to share your thoughts!',
        'Create Your First Journal': 'Create Your First Journal',
        'Login to Create': 'Login to Create',
        'Cancel': 'Cancel',
        'Publish': 'Publish',
        'Close': 'Close',
        'Delete Journal': 'Delete Journal',
        'No journals found': 'No journals found',
        'Try a different search term': 'Try a different search term',
        'Edit journal': 'Edit journal',
        'Delete journal': 'Delete journal',
        'Read only': 'Read only',
        'Your Post': 'Your Post',
        'Edit': 'Edit',
        'Delete': 'Delete',
        'Create New Journal': 'Create New Journal',
        'Edit Journal': 'Edit Journal',
        // Journal form translations
        'Enter your journal title...': 'Enter your journal title...',
        'Write your thoughts here...': 'Write your thoughts here...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'Enter tags separated by commas (e.g., life, thoughts, coding)',
        'Title': 'Title',
        'Content': 'Content',
        'Tags': 'Tags',
        'Separate tags with commas': 'Separate tags with commas',
        'Keep reading': 'Keep reading',
        // Auth page translations
        'Welcome Back': 'Welcome Back',
        'Sign in to your account': 'Sign in to your account',
        'Email Address': 'Email Address',
        'We\'ll never share your email': 'We\'ll never share your email',
        'Password': 'Password',
        'Remember me': 'Remember me',
        'Sign In': 'Sign In',
        'or': 'or',
        'Continue with Google': 'Continue with Google',
        'Fingerprint Login': 'Fingerprint Login',
        'Continue as Guest': 'Continue as Guest',
        'Forgot your password?': 'Forgot your password?',
        'Don\'t have an account?': 'Don\'t have an account?',
        'Sign up': 'Sign up',
        'Join our community of writers': 'Join our community of writers',
        'Full Name *': 'Full Name *',
        'Phone Number': 'Phone Number',
        'Confirm Password': 'Confirm Password',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'Enter the characters shown above',
        'I agree to the': 'I agree to the',
        'Terms of Service': 'Terms of Service',
        'and': 'and',
        'Privacy Policy': 'Privacy Policy',
        'Already have an account? Sign in': 'Already have an account? Sign in',
        'Enter your email': 'Enter your email',
        'Enter your password': 'Enter your password',
        'Create a password': 'Create a password',
        'Confirm your password': 'Confirm your password',
        'Enter your full name': 'Enter your full name',
        'Enter your phone number': 'Enter your phone number',
        'Enter the characters shown above': 'Enter the characters shown above'
    },
    'es': {
        'Blog': 'Blog',
        'Journal/Blog': 'Diario',
        'Home': 'Inicio',
        'Journal': 'Diario',
        'Login': 'Iniciar Sesión',
        'Logout': 'Cerrar Sesión',
        'Welcome to Blog': 'Bienvenido al Blog',
        'Share your stories, connect with writers, and discover new perspectives': 'Comparte tus historias, conecta con escritores y descubre nuevas perspectivas',
        'Get Started': 'Comenzar',
        'Browse Posts': 'Explorar Publicaciones',
        'Features': 'Características',
        'Easy Writing': 'Escritura Fácil',
        'Create and manage your journals with our intuitive editor': 'Crea y administra tus diarios con nuestro editor intuitivo',
        'Multi-language Support': 'Soporte Multiidioma',
        'Translate content and support RTL languages like Arabic': 'Traduce contenido y soporta idiomas RTL como árabe',
        'Accessibility First': 'Accesibilidad Primero',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'Texto a voz, modo para daltónicos y fuente amigable con dislexia',
        'Biometric Login': 'Inicio de Sesión Biométrico',
        'Secure fingerprint/face recognition login using WebAuthn': 'Inicio de sesión seguro con huella facial usando WebAuthn',
        'Auto-Save Drafts': 'Guardado Automático de Borradores',
        'Never lose your work with automatic draft saving': 'Nunca pierdas tu trabajo con guardado automático de borradores',
        'Activity Tracking': 'Seguimiento de Actividad',
        'Track your time spent reading and writing': 'Rastrea tu tiempo dedicado a leer y escribir',
        'How It Works': 'Cómo Funciona',
        'Create Account': 'Crear Cuenta',
        'Sign up with email, Google, or go anonymous': 'Regístrate con email, Google o ve anónimo',
        'Write Blog': 'Escribir Blog',
        'Write Journal': 'Escribir Diario',
        'Share your thoughts with our easy-to-use editor': 'Comparte tus pensamientos con nuestro editor fácil de usar',
        'Connect': 'Conectar',
        'Interactúa con otros escritores y lectores': 'Interactúa con otros escritores y lectores',
        'Ready to Start Writing?': '¿Listo para Empezar a Escribir?',
        'Join our community of writers and share your story with the world': 'Únete a nuestra comunidad de escritores y comparte tu historia con el mundo',
        'Create Free Account': 'Crear Cuenta Gratuita',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 Diario/Blog. Todos los derechos reservados.',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'Construido con HTML, CSS, JavaScript Vanilla y Firebase',
        // Journal page translations
        'Latest Posts': 'Últimas Publicaciones',
        'Discover articles from our community of writers': 'Descubre artículos de nuestra comunidad de escritores',
        'Welcome back': 'Bienvenido de vuelta',
        'Great to have you here': 'Qué bueno tenerte aquí',
        'Your Time on Site': 'Tu Tiempo en el Sitio',
        'Create Journal': 'Crear Diario',
        'Search journals...': 'Buscar diarios...',
        'Most Recent': 'Más Reciente',
        'Oldest First': 'Más Antiguo Primero',
        'Most Popular': 'Más Popular',
        'No journals yet': 'Aún no hay diarios',
        'Be the first to share your thoughts!': '¡Sé el primero en compartir tus pensamientos!',
        'Create Your First Journal': 'Crea Tu Primer Diario',
        'Login to Create': 'Inicia Sesión para Crear',
        'Cancel': 'Cancelar',
        'Publish': 'Publicar',
        'Close': 'Cerrar',
        'Delete Journal': 'Eliminar Diario',
        'No journals found': 'No se encontraron diarios',
        'Try a different search term': 'Prueba un término de búsqueda diferente',
        'Edit journal': 'Editar diario',
        'Delete journal': 'Eliminar diario',
        'Read only': 'Solo lectura',
        'Your Post': 'Tu Publicación',
        'Edit': 'Editar',
        'Delete': 'Eliminar',
        'Create New Journal': 'Crear Nuevo Diario',
        'Edit Journal': 'Editar Diario',
        // Journal form translations
        'Enter your journal title...': 'Ingresa el título de tu diario...',
        'Write your thoughts here...': 'Escribe tus pensamientos aquí...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'Ingresa etiquetas separadas por comas (ej.: vida, pensamientos, programación)',
        'Title': 'Título',
        'Content': 'Contenido',
        'Tags': 'Etiquetas',
        'Separate tags with commas': 'Separa etiquetas con comas',
        'Keep reading': 'Sigue leyendo',
        // Auth page translations
        'Welcome Back': 'Bienvenido de Vuelta',
        'Sign in to your account': 'Inicia sesión en tu cuenta',
        'Email Address': 'Dirección de Correo Electrónico',
        'We\'ll never share your email': 'Nunca compartiremos tu correo electrónico',
        'Password': 'Contraseña',
        'Remember me': 'Recuérdame',
        'Sign In': 'Iniciar Sesión',
        'or': 'o',
        'Continue with Google': 'Continuar con Google',
        'Fingerprint Login': 'Inicio de Sesión con Huella Dactilar',
        'Continue as Guest': 'Continuar como Invitado',
        'Forgot your password?': '¿Olvidaste tu contraseña?',
        'Don\'t have an account?': '¿No tienes una cuenta?',
        'Sign up': 'Regístrate',
        'Join our community of writers': 'Únete a nuestra comunidad de escritores',
        'Full Name *': 'Nombre Completo *',
        'Phone Number': 'Número de Teléfono',
        'Confirm Password': 'Confirmar Contraseña',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'Ingresa los caracteres mostrados arriba',
        'I agree to the': 'Acepto los',
        'Terms of Service': 'Términos de Servicio',
        'and': 'y',
        'Privacy Policy': 'Política de Privacidad',
        'Already have an account? Sign in': '¿Ya tienes una cuenta? Inicia sesión',
        'Enter your email': 'Ingresa tu correo electrónico',
        'Enter your password': 'Ingresa tu contraseña',
        'Create a password': 'Crea una contraseña',
        'Confirm your password': 'Confirma tu contraseña',
        'Enter your full name': 'Ingresa tu nombre completo',
        'Enter your phone number': 'Ingresa tu número de teléfono',
        'Enter the characters shown above': 'Ingresa los caracteres mostrados arriba'
    },
    'fr': {
        'Blog': 'Blog',
        'Journal/Blog': 'Journal',
        'Home': 'Accueil',
        'Journal': 'Journal',
        'Login': 'Connexion',
        'Logout': 'Déconnexion',
        'Welcome to Blog': 'Bienvenue sur le Blog',
        'Share your stories, connect with writers, and discover new perspectives': 'Partagez vos histoires, connectez-vous avec des écrivains et découvrez de nouvelles perspectives',
        'Get Started': 'Commencer',
        'Browse Posts': 'Parcourir les Articles',
        'Features': 'Fonctionnalités',
        'Easy Writing': 'Écriture Facile',
        'Create and manage your journals with our intuitive editor': 'Créez et gérez vos journaux avec notre éditeur intuitif',
        'Multi-language Support': 'Support Multilingue',
        'Translate content and support RTL languages like Arabic': 'Traduisez le contenu et supportez les langues RTL comme l\'arabe',
        'Accessibility First': 'Accessibilité d\'Abord',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'Synthèse vocale, mode daltonien et police adaptée à la dyslexie',
        'Biometric Login': 'Connexion Biométrique',
        'Secure fingerprint/face recognition login using WebAuthn': 'Connexion sécurisée par empreinte/faciale utilisant WebAuthn',
        'Auto-Save Drafts': 'Sauvegarde Automatique des Brouillons',
        'Never lose your work with automatic draft saving': 'Ne perdez jamais votre travail grâce à la sauvegarde automatique des brouillons',
        'Activity Tracking': 'Suivi d\'Activité',
        'Track your time spent reading and writing': 'Suivez votre temps passé à lire et écrire',
        'How It Works': 'Comment Ça Marche',
        'Create Account': 'Créer un Compte',
        'Sign up with email, Google, or go anonymous': 'Inscrivez-vous avec email, Google ou allez anonyme',
        'Write Blog': 'Écrire un Blog',
        'Write Journal': 'Écrire un Journal',
        'Share your thoughts with our easy-to-use editor': 'Partagez vos pensées avec notre éditeur facile à utiliser',
        'Connect': 'Se Connecter',
        'Engagez-vous avec d\'autres écrivains et lecteurs': 'Engagez-vous avec d\'autres écrivains et lecteurs',
        'Ready to Start Writing?': 'Prêt à Commencer à Écrire ?',
        'Join our community of writers and share your story with the world': 'Rejoignez notre communauté d\'écrivains et partagez votre histoire avec le monde',
        'Create Free Account': 'Créer un Compte Gratuit',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 Journal/Blog. Tous droits réservés.',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'Construit avec HTML, CSS, JavaScript Vanilla et Firebase',
        // Journal page translations
        'Latest Posts': 'Derniers Articles',
        'Discover articles from our community of writers': 'Découvrez les articles de notre communauté d\'écrivains',
        'Welcome back': 'Bienvenue de retour',
        'Great to have you here': 'C\'est génial de vous avoir ici',
        'Your Time on Site': 'Votre Temps sur le Site',
        'Create Journal': 'Créer un Journal',
        'Search journals...': 'Rechercher des journaux...',
        'Most Recent': 'Plus Récent',
        'Oldest First': 'Plus Ancien D\'Abord',
        'Most Popular': 'Plus Populaire',
        'No journals yet': 'Aucun journal encore',
        'Be the first to share your thoughts!': 'Soyez le premier à partager vos pensées !',
        'Create Your First Journal': 'Créez Votre Premier Journal',
        'Login to Create': 'Connectez-vous pour Créer',
        'Cancel': 'Annuler',
        'Publish': 'Publier',
        'Close': 'Fermer',
        'Delete Journal': 'Supprimer le Journal',
        'No journals found': 'Aucun journal trouvé',
        'Try a different search term': 'Essayez un autre terme de recherche',
        'Edit journal': 'Modifier le journal',
        'Delete journal': 'Supprimer le journal',
        'Read only': 'Lecture seule',
        'Your Post': 'Votre Publication',
        'Edit': 'Modifier',
        'Delete': 'Supprimer',
        'Create New Journal': 'Créer un Nouveau Journal',
        'Edit Journal': 'Modifier le Journal',
        // Journal form translations
        'Enter your journal title...': 'Entrez le titre de votre journal...',
        'Write your thoughts here...': 'Écrivez vos pensées ici...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'Entrez des tags séparés par des virgules (ex.: vie, pensées, programmation)',
        'Title': 'Titre',
        'Content': 'Contenu',
        'Tags': 'Tags',
        'Separate tags with commas': 'Séparez les tags par des virgules',
        'Keep reading': 'Continuer à lire',
        // Auth page translations
        'Welcome Back': 'Bienvenue de Retour',
        'Sign in to your account': 'Connectez-vous à votre compte',
        'Email Address': 'Adresse E-mail',
        'We\'ll never share your email': 'Nous ne partagerons jamais votre e-mail',
        'Password': 'Mot de Passe',
        'Remember me': 'Se souvenir de moi',
        'Sign In': 'Se Connecter',
        'or': 'ou',
        'Continue with Google': 'Continuer avec Google',
        'Fingerprint Login': 'Connexion par Empreinte Digitale',
        'Continue as Guest': 'Continuer en tant qu\'Invité',
        'Forgot your password?': 'Mot de passe oublié ?',
        'Don\'t have an account?': 'Vous n\'avez pas de compte ?',
        'Sign up': 'S\'inscrire',
        'Join our community of writers': 'Rejoignez notre communauté d\'écrivains',
        'Full Name *': 'Nom Complet *',
        'Phone Number': 'Numéro de Téléphone',
        'Confirm Password': 'Confirmer le Mot de Passe',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'Entrez les caractères affichés ci-dessus',
        'I agree to the': 'J\'accepte les',
        'Terms of Service': 'Conditions d\'Utilisation',
        'and': 'et',
        'Privacy Policy': 'Politique de Confidentialité',
        'Already have an account? Sign in': 'Vous avez déjà un compte ? Connectez-vous',
        'Enter your email': 'Entrez votre e-mail',
        'Enter your password': 'Entrez votre mot de passe',
        'Create a password': 'Créez un mot de passe',
        'Confirm your password': 'Confirmez votre mot de passe',
        'Enter your full name': 'Entrez votre nom complet',
        'Enter your phone number': 'Entrez votre numéro de téléphone',
        'Enter the characters shown above': 'Entrez les caractères affichés ci-dessus'
    },
    'de': {
        'Blog': 'Blog',
        'Journal/Blog': 'Tagebuch',
        'Home': 'Startseite',
        'Journal': 'Tagebuch',
        'Login': 'Anmelden',
        'Logout': 'Abmelden',
        'Welcome to Blog': 'Willkommen beim Blog',
        'Share your stories, connect with writers, and discover new perspectives': 'Teilen Sie Ihre Geschichten, verbinden Sie sich mit Schriftstellern und entdecken Sie neue Perspektiven',
        'Get Started': 'Loslegen',
        'Browse Posts': 'Beiträge Durchsuchen',
        'Features': 'Funktionen',
        'Easy Writing': 'Einfaches Schreiben',
        'Create and manage your journals with our intuitive editor': 'Erstellen und verwalten Sie Ihre Tagebücher mit unserem intuitiven Editor',
        'Multi-language Support': 'Mehrsprachiger Support',
        'Translate content and support RTL languages like Arabic': 'Übersetzen Sie Inhalte und unterstützen Sie RTL-Sprachen wie Arabisch',
        'Accessibility First': 'Barrierefreiheit Zuerst',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'Text-to-Speech, Farbenblind-Modus und dyslexiefreundliche Schriftart',
        'Biometric Login': 'Biometrische Anmeldung',
        'Secure fingerprint/face recognition login using WebAuthn': 'Sichere Anmeldung mit Fingerabdruck/Gesichtserkennung mit WebAuthn',
        'Auto-Save Drafts': 'Automatisches Speichern von Entwürfen',
        'Never lose your work with automatic draft saving': 'Verlieren Sie niemals Ihre Arbeit durch automatisches Speichern von Entwürfen',
        'Activity Tracking': 'Aktivitätsverfolgung',
        'Track your time spent reading and writing': 'Verfolgen Sie Ihre Zeit beim Lesen und Schreiben',
        'How It Works': 'Wie Es Funktioniert',
        'Create Account': 'Konto Erstellen',
        'Sign up with email, Google, or go anonymous': 'Melden Sie sich mit E-Mail, Google an oder gehen Sie anonym',
        'Write Blog': 'Blog Schreiben',
        'Write Journal': 'Tagebuch Schreiben',
        'Share your thoughts with our easy-to-use editor': 'Teilen Sie Ihre Gedanken mit unserem benutzerfreundlichen Editor',
        'Connect': 'Verbinden',
        'Engagieren Sie sich mit anderen Schriftstellern und Lesern': 'Engagieren Sie sich mit anderen Schriftstellern und Lesern',
        'Ready to Start Writing?': 'Bereit zum Schreiben?',
        'Join our community of writers and share your story with the world': 'Treten Sie unserer Gemeinschaft von Schriftstellern bei und teilen Sie Ihre Geschichte mit der Welt',
        'Create Free Account': 'Kostenloses Konto Erstellen',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 Tagebuch/Blog. Alle Rechte vorbehalten.',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'Erstellt mit HTML, CSS, Vanilla JavaScript und Firebase',
        // Journal page translations
        'Latest Posts': 'Neueste Beiträge',
        'Discover articles from our community of writers': 'Entdecken Sie Artikel aus unserer Schriftstellergemeinschaft',
        'Welcome back': 'Willkommen zurück',
        'Great to have you here': 'Schön, dass Sie hier sind',
        'Your Time on Site': 'Ihre Zeit auf der Seite',
        'Create Journal': 'Tagebuch Erstellen',
        'Search journals...': 'Tagebücher suchen...',
        'Most Recent': 'Neueste',
        'Oldest First': 'Älteste Zuerst',
        'Most Popular': 'Beliebteste',
        'No journals yet': 'Noch keine Tagebücher',
        'Be the first to share your thoughts!': 'Seien Sie der Erste, der Ihre Gedanken teilt!',
        'Create Your First Journal': 'Erstellen Sie Ihr Erstes Tagebuch',
        'Login to Create': 'Anmelden zum Erstellen',
        'Cancel': 'Abbrechen',
        'Publish': 'Veröffentlichen',
        'Close': 'Schließen',
        'Delete Journal': 'Tagebuch Löschen',
        'No journals found': 'Keine Tagebücher gefunden',
        'Try a different search term': 'Versuchen Sie einen anderen Suchbegriff',
        'Edit journal': 'Tagebuch bearbeiten',
        'Delete journal': 'Tagebuch löschen',
        'Read only': 'Nur lesen',
        'Your Post': 'Ihr Beitrag',
        'Edit': 'Bearbeiten',
        'Delete': 'Löschen',
        'Create New Journal': 'Neues Tagebuch Erstellen',
        'Edit Journal': 'Tagebuch Bearbeiten',
        // Journal form translations
        'Enter your journal title...': 'Geben Sie Ihren Tagebuchtitel ein...',
        'Write your thoughts here...': 'Schreiben Sie Ihre Gedanken hier...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'Geben Sie Tags durch Kommas getrennt ein (z.B. Leben, Gedanken, Programmieren)',
        'Title': 'Titel',
        'Content': 'Inhalt',
        'Tags': 'Tags',
        'Separate tags with commas': 'Tags durch Kommas trennen',
        'Keep reading': 'Weiterlesen',
        // Auth page translations
        'Welcome Back': 'Willkommen Zurück',
        'Sign in to your account': 'Melden Sie sich in Ihrem Konto an',
        'Email Address': 'E-Mail-Adresse',
        'We\'ll never share your email': 'Wir werden Ihre E-Mail niemals teilen',
        'Password': 'Passwort',
        'Remember me': 'Erinnern Sie sich an mich',
        'Sign In': 'Anmelden',
        'or': 'oder',
        'Continue with Google': 'Mit Google fortfahren',
        'Fingerprint Login': 'Fingerabdruck-Anmeldung',
        'Continue as Guest': 'Als Gast fortfahren',
        'Forgot your password?': 'Passwort vergessen?',
        'Don\'t have an account?': 'Haben Sie kein Konto?',
        'Sign up': 'Registrieren',
        'Join our community of writers': 'Treten Sie unserer Schriftstellergemeinschaft bei',
        'Full Name *': 'Vollständiger Name *',
        'Phone Number': 'Telefonnummer',
        'Confirm Password': 'Passwort Bestätigen',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'Geben Sie die oben gezeigten Zeichen ein',
        'I agree to the': 'Ich stimme den',
        'Terms of Service': 'Nutzungsbedingungen',
        'and': 'und',
        'Privacy Policy': 'Datenschutzrichtlinie',
        'Already have an account? Sign in': 'Haben Sie bereits ein Konto? Anmelden',
        'Enter your email': 'Geben Sie Ihre E-Mail ein',
        'Enter your password': 'Geben Sie Ihr Passwort ein',
        'Create a password': 'Erstellen Sie ein Passwort',
        'Confirm your password': 'Bestätigen Sie Ihr Passwort',
        'Enter your full name': 'Geben Sie Ihren vollständigen Namen ein',
        'Enter your phone number': 'Geben Sie Ihre Telefonnummer ein',
        'Enter the characters shown above': 'Geben Sie die oben gezeigten Zeichen ein'
    },
    'zh': {
        'Blog': '博客',
        'Journal/Blog': '日志',
        'Home': '首页',
        'Journal': '日志',
        'Login': '登录',
        'Logout': '登出',
        'Welcome to Blog': '欢迎来到博客',
        'Share your stories, connect with writers, and discover new perspectives': '分享您的故事，与作家连接，发现新视角',
        'Get Started': '开始使用',
        'Browse Posts': '浏览帖子',
        'Features': '功能',
        'Easy Writing': '轻松写作',
        'Create and manage your journals with our intuitive editor': '使用我们的直观编辑器创建和管理您的日志',
        'Multi-language Support': '多语言支持',
        'Translate content and support RTL languages like Arabic': '翻译内容并支持阿拉伯语等RTL语言',
        'Accessibility First': '无障碍优先',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': '语音合成、色盲模式和阅读障碍友好字体',
        'Biometric Login': '生物识别登录',
        'Secure fingerprint/face recognition login using WebAuthn': '使用WebAuthn的安全指纹/面部识别登录',
        'Auto-Save Drafts': '自动保存草稿',
        'Never lose your work with automatic draft saving': '通过自动保存草稿永不丢失您的作品',
        'Activity Tracking': '活动跟踪',
        'Track your time spent reading and writing': '跟踪您阅读和写作的时间',
        'How It Works': '如何工作',
        'Create Account': '创建账户',
        'Sign up with email, Google, or go anonymous': '使用电子邮件、Google注册或匿名访问',
        'Write Blog': '写博客',
        'Write Journal': '写日志',
        'Share your thoughts with our easy-to-use editor': '使用我们易用的编辑器分享您的想法',
        'Connect': '连接',
        '与其他作家和读者互动': '与其他作家和读者互动',
        'Ready to Start Writing?': '准备开始写作了吗？',
        'Join our community of writers and share your story with the world': '加入我们的作家社区，与世界分享您的故事',
        'Create Free Account': '创建免费账户',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 日志/博客。保留所有权利。',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': '使用HTML、CSS、Vanilla JavaScript和Firebase构建',
        // Journal page translations
        'Latest Posts': '最新帖子',
        'Discover articles from our community of writers': '发现我们作家社区的文章',
        'Welcome back': '欢迎回来',
        'Great to have you here': '很高兴您在这里',
        'Your Time on Site': '您在网站上的时间',
        'Create Journal': '创建日志',
        'Search journals...': '搜索日志...',
        'Most Recent': '最新',
        'Oldest First': '最旧优先',
        'Most Popular': '最受欢迎',
        'No journals yet': '还没有日志',
        'Be the first to share your thoughts!': '成为第一个分享您的想法的人！',
        'Create Your First Journal': '创建您的第一个日志',
        'Login to Create': '登录创建',
        'Cancel': '取消',
        'Publish': '发布',
        'Close': '关闭',
        'Delete Journal': '删除日志',
        'No journals found': '未找到日志',
        'Try a different search term': '尝试不同的搜索词',
        'Edit journal': '编辑日志',
        'Delete journal': '删除日志',
        'Read only': '只读',
        'Your Post': '您的帖子',
        'Edit': '编辑',
        'Delete': '删除',
        'Create New Journal': '创建新日志',
        'Edit Journal': '编辑日志',
        // Journal form translations
        'Enter your journal title...': '输入您的日志标题...',
        'Write your thoughts here...': '在这里写下您的想法...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': '输入用逗号分隔的标签（例如：生活、想法、编程）',
        'Title': '标题',
        'Content': '内容',
        'Tags': '标签',
        'Separate tags with commas': '用逗号分隔标签',
        'Keep reading': '继续阅读',
        // Auth page translations
        'Welcome Back': '欢迎回来',
        'Sign in to your account': '登录您的账户',
        'Email Address': '电子邮件地址',
        'We\'ll never share your email': '我们绝不会分享您的电子邮件',
        'Password': '密码',
        'Remember me': '记住我',
        'Sign In': '登录',
        'or': '或',
        'Continue with Google': '继续使用Google',
        'Fingerprint Login': '指纹登录',
        'Continue as Guest': '作为访客继续',
        'Forgot your password?': '忘记密码？',
        'Don\'t have an account?': '没有账户？',
        'Sign up': '注册',
        'Join our community of writers': '加入我们的作家社区',
        'Full Name *': '全名 *',
        'Phone Number': '电话号码',
        'Confirm Password': '确认密码',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': '输入上面显示的字符',
        'I agree to the': '我同意',
        'Terms of Service': '服务条款',
        'and': '和',
        'Privacy Policy': '隐私政策',
        'Already have an account? Sign in': '已经有账户？登录',
        'Enter your email': '输入您的电子邮件',
        'Enter your password': '输入您的密码',
        'Create a password': '创建密码',
        'Confirm your password': '确认您的密码',
        'Enter your full name': '输入您的全名',
        'Enter your phone number': '输入您的电话号码',
        'Enter the characters shown above': '输入上面显示的字符'
    },
    'ja': {
        'Blog': 'ブログ',
        'Journal/Blog': '日記',
        'Home': 'ホーム',
        'Journal': '日記',
        'Login': 'ログイン',
        'Logout': 'ログアウト',
        'Welcome to Blog': '日記/ブログへようこそ',
        'Share your stories, connect with writers, and discover new perspectives': 'あなたの物語を共有し、作家とつながり、新しい視点を発見しましょう',
        'Get Started': '始める',
        'Browse Posts': '投稿を閲覧',
        'Features': '機能',
        'Easy Writing': '簡単な執筆',
        'Create and manage your journals with our intuitive editor': '直感的なエディタで日記を作成・管理',
        'Multi-language Support': '多言語サポート',
        'Translate content and support RTL languages like Arabic': 'コンテンツを翻訳し、アラビア語などのRTL言語をサポート',
        'Accessibility First': 'アクセシビリティ優先',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': '音声合成、色覚障害モード、読字障害対応フォント',
        'Biometric Login': '生体認証ログイン',
        'Secure fingerprint/face recognition login using WebAuthn': 'WebAuthnを使用した安全な指紋/顔認識ログイン',
        'Auto-Save Drafts': '自動保存下書き',
        'Never lose your work with automatic draft saving': '自動保存で作品を失わない',
        'Activity Tracking': '活動追跡',
        'Track your time spent reading and writing': '読書と執筆の時間を追跡',
        'How It Works': '仕組み',
        'Create Account': 'アカウント作成',
        'Sign up with email, Google, or go anonymous': 'メール、Googleで登録、または匿名で',
        'Write Blog': 'ブログを書く',
        'Write Journal': '日記を書く',
        'Share your thoughts with our easy-to-use editor': '使いやすいエディタであなたの考えを共有',
        'Connect': 'つながる',
        '他の作家や読者と交流': '他の作家や読者と交流',
        'Ready to Start Writing?': '執筆を開始する準備はできましたか？',
        'Join our community of writers and share your story with the world': '作家コミュニティに参加し、世界にあなたの物語を共有',
        'Create Free Account': '無料アカウント作成',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 日記/ブログ。全著作権所有。',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'HTML、CSS、Vanilla JavaScript、Firebaseで構築',
        // Journal page translations
        'Latest Posts': '最新の投稿',
        'Discover articles from our community of writers': '作家コミュニティの記事を発見',
        'Welcome back': 'おかえりなさい',
        'Great to have you here': 'ここにいてくれて嬉しいです',
        'Your Time on Site': 'サイトでのあなたの時間',
        'Create Journal': '日記を作成',
        'Search journals...': '日記を検索...',
        'Most Recent': '最新',
        'Oldest First': '古い順',
        'Most Popular': '最も人気',
        'No journals yet': 'まだ日記はありません',
        'Be the first to share your thoughts!': 'あなたの考えを最初に共有しましょう！',
        'Create Your First Journal': '最初の日記を作成',
        'Login to Create': '作成するにはログイン',
        'Cancel': 'キャンセル',
        'Publish': '公開',
        'Close': '閉じる',
        'Delete Journal': '日記を削除',
        'No journals found': '日記が見つかりません',
        'Try a different search term': '別の検索語を試してください',
        'Edit journal': '日記を編集',
        'Delete journal': '日記を削除',
        'Read only': '読み取り専用',
        'Your Post': 'あなたの投稿',
        'Edit': '編集',
        'Delete': '削除',
        'Create New Journal': '新しい日記を作成',
        'Edit Journal': '日記を編集',
        // Journal form translations
        'Enter your journal title...': '日記のタイトルを入力...',
        'Write your thoughts here...': 'ここにあなたの考えを書いてください...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'コンマで区切られたタグを入力（例：生活、考え、コーディング）',
        'Title': 'タイトル',
        'Content': '内容',
        'Tags': 'タグ',
        'Separate tags with commas': 'タグをコンマで区切る',
        'Keep reading': '読み続ける',
        // Auth page translations
        'Welcome Back': 'おかえりなさい',
        'Sign in to your account': 'アカウントにサインイン',
        'Email Address': 'メールアドレス',
        'We\'ll never share your email': 'あなたのメールを共有することはありません',
        'Password': 'パスワード',
        'Remember me': '私を覚えておく',
        'Sign In': 'サインイン',
        'or': 'または',
        'Continue with Google': 'Googleで続ける',
        'Fingerprint Login': '指紋ログイン',
        'Continue as Guest': 'ゲストとして続ける',
        'Forgot your password?': 'パスワードを忘れましたか？',
        'Don\'t have an account?': 'アカウントをお持ちですか？',
        'Sign up': 'サインアップ',
        'Join our community of writers': '作家コミュニティに参加',
        'Full Name *': 'フルネーム *',
        'Phone Number': '電話番号',
        'Confirm Password': 'パスワードを確認',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': '上に表示された文字を入力',
        'I agree to the': '私は同意します',
        'Terms of Service': '利用規約',
        'and': 'と',
        'Privacy Policy': 'プライバシーポリシー',
        'Already have an account? Sign in': 'すでにアカウントをお持ちですか？サインイン',
        'Enter your email': 'メールを入力',
        'Enter your password': 'パスワードを入力',
        'Create a password': 'パスワードを作成',
        'Confirm your password': 'パスワードを確認',
        'Enter your full name': 'フルネームを入力',
        'Enter your phone number': '電話番号を入力',
        'Enter the characters shown above': '上に表示された文字を入力'
    },
    'bn': {
        'Blog': 'ব্লগ',
        'Journal/Blog': 'জার্নাল',
        'Home': 'হোম',
        'Journal': 'জার্নাল',
        'Login': 'লগইন',
        'Logout': 'লগআউট',
        'Welcome to Blog': 'ব্লগে স্বাগতম',
        'Share your stories, connect with writers, and discover new perspectives': 'আপনার গল্পগুলি ভাগ করুন, লেখকদের সাথে সংযোগ করুন এবং নতুন দৃষ্টিভঙ্গি আবিষ্কার করুন',
        'Get Started': 'শুরু করুন',
        'Browse Posts': 'পোস্ট ব্রাউজ করুন',
        'Features': 'বৈশিষ্ট্য',
        'Easy Writing': 'সহজ লেখা',
        'Create and manage your journals with our intuitive editor': 'আমাদের স্বজ্ঞাত সম্পাদকের সাথে আপনার জার্নাল তৈরি এবং পরিচালনা করুন',
        'Multi-language Support': 'বহু-ভাষা সমর্থন',
        'Translate content and support RTL languages like Arabic': 'সামগ্রী অনুবাদ করুন এবং আরবি-র মতো RTL ভাষা সমর্থন করুন',
        'Accessibility First': 'প্রথমে অ্যাক্সেসিবিলিটি',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'টেক্সট-টু-স্পিচ, কালার ব্লাইন্ড মোড, এবং ডিস্লেক্সিয়া-বান্ধব ফন্ট',
        'Biometric Login': 'বায়োমেট্রিক লগইন',
        'Secure fingerprint/face recognition login using WebAuthn': 'WebAuthn ব্যবহার করে নিরাপদ ফিঙ্গারপ্রিন্ট/ফেস রেকগনিশন লগইন',
        'Auto-Save Drafts': 'অটো-সেভ ড্রাফ্টস',
        'Never lose your work with automatic draft saving': 'স্বয়ংক্রিয় ড্রাফ্ট সেভিং দিয়ে আপনার কাজ কখনও হারাবেন না',
        'Activity Tracking': 'অ্যাক্টিভিটি ট্র্যাকিং',
        'Track your time spent reading and writing': 'পড়া এবং লেখায় আপনার সময় ট্র্যাক করুন',
        'How It Works': 'কীভাবে কাজ করে',
        'Create Account': 'অ্যাকাউন্ট তৈরি করুন',
        'Sign up with email, Google, or go anonymous': 'ইমেল, Google দিয়ে সাইন আপ করুন বা অ্যানোনিমাস যান',
        'Write Blog': 'ব্লগ লিখুন',
        'Write Journal': 'জার্নাল লিখুন',
        'Share your thoughts with our easy-to-use editor': 'আমাদের সহজ-ব্যবহার সম্পাদকের সাথে আপনার চিন্তা ভাগ করুন',
        'Connect': 'সংযোগ করুন',
        'Engage with other writers and readers': 'অন্যান্য লেখক এবং পাঠকদের সাথে জড়িত হন',
        'Ready to Start Writing?': 'লেখা শুরু করতে প্রস্তুত?',
        'Join our community of writers and share your story with the world': 'আমাদের লেখক সম্প্রদায়ে যোগ দিন এবং বিশ্বের সাথে আপনার গল্প ভাগ করুন',
        'Create Free Account': 'বিনামূল্যে অ্যাকাউন্ট তৈরি করুন',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 জার্নাল/ব্লগ। সমস্ত অধিকার সংরক্ষিত।',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'HTML, CSS, Vanilla JavaScript, এবং Firebase দিয়ে তৈরি',
        // Journal page translations
        'Latest Posts': 'সর্বশেষ পোস্ট',
        'Discover articles from our community of writers': 'আমাদের লেখক সম্প্রদায়ের নিবন্ধ আবিষ্কার করুন',
        'Welcome back': 'আবার স্বাগতম',
        'Great to have you here': 'আপনাকে এখানে থাকতে ভাল লাগছে',
        'Your Time on Site': 'সাইটে আপনার সময়',
        'Create Journal': 'জার্নাল তৈরি করুন',
        'Search journals...': 'জার্নাল অনুসন্ধান করুন...',
        'Most Recent': 'সর্বাধিক সাম্প্রতিক',
        'Oldest First': 'পুরানো প্রথম',
        'Most Popular': 'সর্বাধিক জনপ্রিয়',
        'No journals yet': 'এখনও কোন জার্নাল নেই',
        'Be the first to share your thoughts!': 'আপনার চিন্তা ভাগ করার জন্য প্রথম হন!',
        'Create Your First Journal': 'আপনার প্রথম জার্নাল তৈরি করুন',
        'Login to Create': 'তৈরি করতে লগইন করুন',
        'Cancel': 'বাতিল',
        'Publish': 'প্রকাশ করুন',
        'Close': 'বন্ধ',
        'Delete Journal': 'জার্নাল মুছুন',
        'No journals found': 'কোন জার্নাল পাওয়া যায়নি',
        'Try a different search term': 'একটি ভিন্ন অনুসন্ধান শব্দ চেষ্টা করুন',
        'Edit journal': 'জার্নাল সম্পাদনা করুন',
        'Delete journal': 'জার্নাল মুছুন',
        'Read only': 'শুধুমাত্র পড়ুন',
        'Your Post': 'আপনার পোস্ট',
        'Edit': 'সম্পাদনা',
        'Delete': 'মুছুন',
        'Create New Journal': 'নতুন জার্নাল তৈরি করুন',
        'Edit Journal': 'জার্নাল সম্পাদনা করুন',
        // Journal form translations
        'Enter your journal title...': 'আপনার জার্নাল শিরোনাম লিখুন...',
        'Write your thoughts here...': 'এখানে আপনার চিন্তা লিখুন...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'কমা দিয়ে আলাদা করে ট্যাগ লিখুন (যেমন: জীবন, চিন্তা, কোডিং)',
        'Title': 'শিরোনাম',
        'Content': 'সামগ্রী',
        'Tags': 'ট্যাগ',
        'Separate tags with commas': 'কমা দিয়ে ট্যাগ আলাদা করুন',
        'Keep reading': 'পড়তে থাকুন',
        // Auth page translations
        'Welcome Back': 'আবার স্বাগতম',
        'Sign in to your account': 'আপনার অ্যাকাউন্টে সাইন ইন করুন',
        'Email Address': 'ইমেল ঠিকানা',
        'We\'ll never share your email': 'আমরা কখনও আপনার ইমেল ভাগ করব না',
        'Password': 'পাসওয়ার্ড',
        'Remember me': 'আমাকে মনে রাখুন',
        'Sign In': 'সাইন ইন',
        'or': 'বা',
        'Continue with Google': 'Google দিয়ে চালিয়ে যান',
        'Fingerprint Login': 'ফিঙ্গারপ্রিন্ট লগইন',
        'Continue as Guest': 'গেস্ট হিসেবে চালিয়ে যান',
        'Forgot your password?': 'আপনার পাসওয়ার্ড ভুলে গেছেন?',
        'Don\'t have an account?': 'অ্যাকাউন্ট নেই?',
        'Sign up': 'সাইন আপ',
        'Join our community of writers': 'আমাদের লেখক সম্প্রদায়ে যোগ দিন',
        'Full Name *': 'পুরো নাম *',
        'Phone Number': 'ফোন নম্বর',
        'Confirm Password': 'পাসওয়ার্ড নিশ্চিত করুন',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'উপরে দেখানো অক্ষরগুলি লিখুন',
        'I agree to the': 'আমি সম্মত',
        'Terms of Service': 'সেবা শর্তাবলী',
        'and': 'এবং',
        'Privacy Policy': 'গোপনীয়তা নীতি',
        'Already have an account? Sign in': 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে? সাইন ইন করুন',
        'Enter your email': 'আপনার ইমেল লিখুন',
        'Enter your password': 'আপনার পাসওয়ার্ড লিখুন',
        'Create a password': 'একটি পাসওয়ার্ড তৈরি করুন',
        'Confirm your password': 'আপনার পাসওয়ার্ড নিশ্চিত করুন',
        'Enter your full name': 'আপনার পুরো নাম লিখুন',
        'Enter your phone number': 'আপনার ফোন নম্বর লিখুন',
        'Enter the characters shown above': 'উপরে দেখানো অক্ষরগুলি লিখুন'
    },
    'hi': {
        'Blog': 'ब्लॉग',
        'Journal/Blog': 'दैनिकी',
        'Home': 'होम',
        'Journal': 'दैनिकी',
        'Login': 'लॉग इन',
        'Logout': 'लॉग आउट',
        'Welcome to Blog': 'ब्लॉग में आपका स्वागत है',
        'Share your stories, connect with writers, and discover new perspectives': 'अपनी कहानियाँ साझा करें, लेखकों से जुड़ें, और नए दृष्टिकोण खोजें',
        'Get Started': 'शुरू करें',
        'Browse Posts': 'पोस्ट ब्राउज़ करें',
        'Features': 'सुविधाएँ',
        'Easy Writing': 'आसान लेखन',
        'Create and manage your journals with our intuitive editor': 'हमारे सहज संपादक के साथ अपनी डायरी बनाएँ और प्रबंधित करें',
        'Multi-language Support': 'बहु-भाषा समर्थन',
        'Translate content and support RTL languages like Arabic': 'सामग्री का अनुवाद करें और अरबी जैसी RTL भाषाओं का समर्थन करें',
        'Accessibility First': 'पहले पहुंच',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'टेक्स्ट-टू-स्पीच, रंग-अंध मोड, और डिस्लेक्सिया-अनुकूल फ़ॉन्ट',
        'Biometric Login': 'बायोमेट्रिक लॉगिन',
        'Secure fingerprint/face recognition login using WebAuthn': 'WebAuthn का उपयोग करके सुरक्षित फिंगरप्रिंट/चेहरा पहचान लॉगिन',
        'Auto-Save Drafts': 'ड्राफ्ट ऑटो-सेव करें',
        'Never lose your work with automatic draft saving': 'स्वचालित ड्राफ्ट सेविंग के साथ अपना काम कभी न खोएं',
        'Activity Tracking': 'गतिविधि ट्रैकिंग',
        'Track your time spent reading and writing': 'पढ़ने और लिखने में बिताया गया समय ट्रैक करें',
        'How It Works': 'यह कैसे काम करता है',
        'Create Account': 'खाता बनाएँ',
        'Sign up with email, Google, or go anonymous': 'ईमेल, Google के साथ साइन अप करें, या अज्ञात जाएं',
        'Write Blog': 'ब्लॉग लिखें',
        'Write Journal': 'दैनिकी लिखें',
        'Share your thoughts with our easy-to-use editor': 'हमारे उपयोग में आसान संपादक के साथ अपने विचार साझा करें',
        'Connect': 'जुड़ें',
        'Engage with other writers and readers': 'अन्य लेखकों और पाठकों के साथ जुड़ें',
        'Ready to Start Writing?': 'लिखना शुरू करने के लिए तैयार हैं?',
        'Join our community of writers and share your story with the world': 'हमारे लेखक समुदाय में शामिल हों और दुनिया के साथ अपनी कहानी साझा करें',
        'Create Free Account': 'मुफ्त खाता बनाएँ',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 दैनिकी/ब्लॉग। सभी अधिकार सुरक्षित।',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'HTML, CSS, Vanilla JavaScript, और Firebase के साथ निर्मित',
        // Journal page translations
        'Latest Posts': 'नवीनतम पोस्ट',
        'Discover articles from our community of writers': 'हमारे लेखक समुदाय के लेख खोजें',
        'Welcome back': 'वापसी पर स्वागत',
        'Great to have you here': 'आपको यहाँ देखकर अच्छा लगा',
        'Your Time on Site': 'साइट पर आपका समय',
        'Create Journal': 'दैनिकी बनाएँ',
        'Search journals...': 'दैनिकी खोजें...',
        'Most Recent': 'सबसे हालिया',
        'Oldest First': 'सबसे पुराना पहले',
        'Most Popular': 'सबसे लोकप्रिय',
        'No journals yet': 'अभी तक कोई दैनिकी नहीं',
        'Be the first to share your thoughts!': 'अपने विचार साझा करने वाले पहले बनें!',
        'Create Your First Journal': 'अपनी पहली दैनिकी बनाएँ',
        'Login to Create': 'बनाने के लिए लॉग इन करें',
        'Cancel': 'रद्द करें',
        'Publish': 'प्रकाशित करें',
        'Close': 'बंद करें',
        'Delete Journal': 'दैनिकी हटाएँ',
        'No journals found': 'कोई दैनिकी नहीं मिली',
        'Try a different search term': 'कोई दूसरा खोज शब्द आज़माएँ',
        'Edit journal': 'दैनिकी संपादित करें',
        'Delete journal': 'दैनिकी हटाएँ',
        'Read only': 'केवल पढ़ें',
        'Your Post': 'आपकी पोस्ट',
        'Edit': 'संपादित करें',
        'Delete': 'हटाएँ',
        'Create New Journal': 'नई दैनिकी बनाएँ',
        'Edit Journal': 'दैनिकी संपादित करें',
        // Journal form translations
        'Enter your journal title...': 'अपनी दैनिकी का शीर्षक दर्ज करें...',
        'Write your thoughts here...': 'यहाँ अपने विचार लिखें...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'अल्पविराम से अलग किए गए टैग दर्ज करें (जैसे: जीवन, विचार, कोडिंग)',
        'Title': 'शीर्षक',
        'Content': 'सामग्री',
        'Tags': 'टैग',
        'Separate tags with commas': 'अल्पविराम से टैग अलग करें',
        'Keep reading': 'पढ़ते रहें',
        // Auth page translations
        'Welcome Back': 'वापसी पर स्वागत',
        'Sign in to your account': 'अपने खाते में साइन इन करें',
        'Email Address': 'ईमेल पता',
        'We\'ll never share your email': 'हम आपका ईमेल कभी नहीं साझा करेंगे',
        'Password': 'पासवर्ड',
        'Remember me': 'मुझे याद रखें',
        'Sign In': 'साइन इन',
        'or': 'या',
        'Continue with Google': 'Google के साथ जारी रखें',
        'Fingerprint Login': 'फिंगरप्रिंट लॉगिन',
        'Continue as Guest': 'मेहमान के रूप में जारी रखें',
        'Forgot your password?': 'अपना पासवर्ड भूल गए?',
        'Don\'t have an account?': 'खाता नहीं है?',
        'Sign up': 'साइन अप',
        'Join our community of writers': 'हमारे लेखक समुदाय में शामिल हों',
        'Full Name *': 'पूरा नाम *',
        'Phone Number': 'फोन नंबर',
        'Confirm Password': 'पासवर्ड की पुष्टि करें',
        'CAPTCHA *': 'CAPTCHA *',
        'Enter the characters shown above': 'ऊपर दिखाए गए वर्ण दर्ज करें',
        'I agree to the': 'मैं सहमत हूँ',
        'Terms of Service': 'सेवा की शर्तें',
        'and': 'और',
        'Privacy Policy': 'गोपनीयता नीति',
        'Already have an account? Sign in': 'पहले से खाता है? साइन इन करें',
        'Enter your email': 'अपना ईमेल दर्ज करें',
        'Enter your password': 'अपना पासवर्ड दर्ज करें',
        'Create a password': 'एक पासवर्ड बनाएँ',
        'Confirm your password': 'अपना पासवर्ड पुष्टि करें',
        'Enter your full name': 'अपना पूरा नाम दर्ज करें',
        'Enter your phone number': 'अपना फोन नंबर दर्ज करें',
        'Enter the characters shown above': 'ऊपर दिखाए गए वर्ण दर्ज करें'
    },
    'pt': {
        'Blog': 'Blog',
        'Journal/Blog': 'Diário',
        'Home': 'Início',
        'Journal': 'Diário',
        'Login': 'Entrar',
        'Logout': 'Sair',
        'Welcome to Blog': 'Bem-vindo ao Diário/Blog',
        'Share your stories, connect with writers, and discover new perspectives': 'Compartilhe suas histórias, conecte-se com escritores e descubra novas perspectivas',
        'Get Started': 'Começar',
        'Browse Posts': 'Navegar Publicações',
        'Features': 'Recursos',
        'Easy Writing': 'Escrita Fácil',
        'Create and manage your journals with our intuitive editor': 'Crie e gerencie seus diários com nosso editor intuitivo',
        'Multi-language Support': 'Suporte Multilíngue',
        'Translate content and support RTL languages like Arabic': 'Traduza conteúdo e suporte idiomas RTL como árabe',
        'Accessibility First': 'Acessibilidade em Primeiro Lugar',
        'Text-to-speech, color blind mode, and dyslexia-friendly font': 'Texto para fala, modo daltônico e fonte amigável para dislexia',
        'Biometric Login': 'Login Biométrico',
        'Secure fingerprint/face recognition login using WebAuthn': 'Login seguro com impressão digital/reconhecimento facial usando WebAuthn',
        'Auto-Save Drafts': 'Salvar Rascunhos Automaticamente',
        'Never lose your work with automatic draft saving': 'Nunca perca seu trabalho com salvamento automático de rascunhos',
        'Activity Tracking': 'Rastreamento de Atividade',
        'Track your time spent reading and writing': 'Acompanhe seu tempo gasto lendo e escrevendo',
        'How It Works': 'Como Funciona',
        'Create Account': 'Criar Conta',
        'Sign up with email, Google, or go anonymous': 'Cadastre-se com email, Google ou vá anônimo',
        'Write Blog': 'Escrever Blog',
        'Write Journal': 'Escrever Diário',
        'Share your thoughts with our easy-to-use editor': 'Compartilhe seus pensamentos com nosso editor fácil de usar',
        'Connect': 'Conectar',
        'Envolva-se com outros escritores e leitores': 'Envolva-se com outros escritores e leitores',
        'Ready to Start Writing?': 'Pronto para Começar a Escrever?',
        'Join our community of writers and share your story with the world': 'Junte-se à nossa comunidade de escritores e compartilhe sua história com o mundo',
        'Create Free Account': 'Criar Conta Gratuita',
        '© 2024 Journal/Blog. All rights reserved.': '© 2024 Diário/Blog. Todos os direitos reservados.',
        'Built with HTML, CSS, Vanilla JavaScript, and Firebase': 'Construído com HTML, CSS, JavaScript Vanilla e Firebase',
        // Journal page translations
        'Latest Posts': 'Últimas Publicações',
        'Discover articles from our community of writers': 'Descubra artigos de nossa comunidade de escritores',
        'Welcome back': 'Bem-vindo de volta',
        'Great to have you here': 'Que bom ter você aqui',
        'Your Time on Site': 'Seu Tempo no Site',
        'Create Journal': 'Criar Diário',
        'Search journals...': 'Pesquisar diários...',
        'Most Recent': 'Mais Recente',
        'Oldest First': 'Mais Antigo Primeiro',
        'Most Popular': 'Mais Popular',
        'No journals yet': 'Ainda não há diários',
        'Be the first to share your thoughts!': 'Seja o primeiro a compartilhar seus pensamentos!',
        'Create Your First Journal': 'Crie Seu Primeiro Diário',
        'Login to Create': 'Faça Login para Criar',
        'Cancel': 'Cancelar',
        'Publish': 'Publicar',
        'Close': 'Fechar',
        'Delete Journal': 'Excluir Diário',
        'No journals found': 'Nenhum diário encontrado',
        'Try a different search term': 'Tente um termo de pesquisa diferente',
        'Edit journal': 'Editar diário',
        'Delete journal': 'Excluir diário',
        'Read only': 'Somente leitura',
        'Your Post': 'Sua Publicação',
        'Edit': 'Editar',
        'Delete': 'Excluir',
        'Create New Journal': 'Criar Novo Diário',
        'Edit Journal': 'Editar Diário',
        // Journal form translations
        'Enter your journal title...': 'Digite o título do seu diário...',
        'Write your thoughts here...': 'Escreva seus pensamentos aqui...',
        'Enter tags separated by commas (e.g., life, thoughts, coding)': 'Digite tags separadas por vírgulas (ex.: vida, pensamentos, programação)',
        'Title': 'Título',
        'Content': 'Conteúdo',
        'Tags': 'Tags',
        'Separate tags with commas': 'Separe tags com vírgulas',
        'Keep reading': 'Continue lendo'
    }
};

/**
 * Translate Page Content
 * Translates all elements with data-i18n attributes to the selected language
 */
function translatePage(lang) {
    accessibilityState.currentLanguage = lang;
    accessibilityState.isRTL = ['he', 'fa', 'ur'].includes(lang);

    // Apply RTL styles for right-to-left languages
    document.body.classList.toggle('rtl-mode', accessibilityState.isRTL);
    document.body.style.direction = accessibilityState.isRTL ? 'rtl' : 'ltr';

    // Get translations for the selected language
    const langTranslations = translations[lang] || translations['en'];

    // Translate all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (langTranslations[key]) {
            element.textContent = langTranslations[key];
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (langTranslations[key]) {
            element.placeholder = langTranslations[key];
        }
    });

    // Stop any ongoing speech before refreshing TTS setup
    stopSpeech();

    // Refresh TTS setup to use translated text
    if (accessibilityState.ttsEnabled) {
        setupTTS();
    }

    // Save preferences
    saveAccessibilityPreferences();

    // Show message to user
    const langNames = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'zh': '中文',
        'ja': '日本語',
        'bn': 'বাংলা',
        'hi': 'हिन्दी',
        'pt': 'Português'
    };
    showMessage(`Language changed to ${langNames[lang] || lang}.`, 'success');

    // Dispatch custom event to notify other modules of language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}
