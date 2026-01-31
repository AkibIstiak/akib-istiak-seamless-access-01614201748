/**
 * Journal Module
 * Handles all journal/blog CRUD operations using Firebase v9 Modular Syntax
 * 
 * Features:
 * - Create new journals/blogs
 * - Edit existing journals/blogs
 * - Delete journals/blogs
 * - Display journals with user information
 * - Filter and search journals
 * - Sample demo journals for testing
 */

// Import from firebase-config
import {
    auth,
    onAuthStateChanged,
    db,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    firebaseInitialized,
    updateJournal
} from './firebase-config.js';

// Import accessibility functions
import { setupTTS, translatePage } from './accessibility.js';

// DOM Elements
let journalsContainer;
let journalForm;
let searchInput;
let filterSelect;

// Journal state
let currentUser = null;
let userJournals = [];
let allJournals = [];

// Color themes for journal cards
const CARD_THEMES = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// Sample dummy journals for demo with translations
const SAMPLE_JOURNALS = [
    {
        id: 'sample-1',
        title: 'The Art of Mindful Living',
        content: 'Mindfulness is the practice of being fully present and engaged in the current moment. It involves paying attention to our thoughts, feelings, and surroundings without judgment. By cultivating mindfulness, we can reduce stress, improve focus, and enhance our overall well-being. Start with just five minutes of meditation each day, focusing on your breath and letting go of distracting thoughts.',
        tags: ['mindfulness', 'wellness', 'mental health'],
        createdAt: new Date(Date.now() - 86400000),
        userId: 'demo-user-1',
        translations: {
            'en': {
                title: 'The Art of Mindful Living',
                content: 'Mindfulness is the practice of being fully present and engaged in the current moment. It involves paying attention to our thoughts, feelings, and surroundings without judgment. By cultivating mindfulness, we can reduce stress, improve focus, and enhance our overall well-being. Start with just five minutes of meditation each day, focusing on your breath and letting go of distracting thoughts.',
                tags: ['mindfulness', 'wellness', 'mental health']
            },
            'es': {
                title: 'El Arte de Vivir Conscientemente',
                content: 'La atención plena es la práctica de estar completamente presente y comprometido con el momento actual. Involucra prestar atención a nuestros pensamientos, sentimientos y alrededores sin juzgar. Al cultivar la atención plena, podemos reducir el estrés, mejorar el enfoque y potenciar nuestro bienestar general. Comienza con solo cinco minutos de meditación cada día, enfocándote en tu respiración y dejando ir pensamientos distractivos.',
                tags: ['atención plena', 'bienestar', 'salud mental']
            },
            'fr': {
                title: 'L\'Art de Vivre en Pleine Conscience',
                content: 'La pleine conscience est la pratique d\'être pleinement présent et engagé dans le moment actuel. Elle implique de prêter attention à nos pensées, sentiments et environnement sans jugement. En cultivant la pleine conscience, nous pouvons réduire le stress, améliorer la concentration et renforcer notre bien-être général. Commencez par seulement cinq minutes de méditation par jour, en vous concentrant sur votre respiration et en laissant aller les pensées distrayantes.',
                tags: ['pleine conscience', 'bien-être', 'santé mentale']
            },
            'de': {
                title: 'Die Kunst des Achtsamen Lebens',
                content: 'Achtsamkeit ist die Praxis, vollständig präsent und engagiert im aktuellen Moment zu sein. Sie beinhaltet die Aufmerksamkeit auf unsere Gedanken, Gefühle und Umgebung ohne Urteilsvermögen. Durch die Kultivierung von Achtsamkeit können wir Stress reduzieren, den Fokus verbessern und unser allgemeines Wohlbefinden stärken. Beginnen Sie mit nur fünf Minuten Meditation pro Tag, indem Sie sich auf Ihren Atem konzentrieren und ablenkende Gedanken loslassen.',
                tags: ['achtsamkeit', 'wohlbefinden', 'geistige gesundheit']
            },
            'zh': {
                title: '正念生活的艺术',
                content: '正念是完全存在并参与当前时刻的实践。它涉及注意我们的思想、感受和周围环境，而不进行判断。通过培养正念，我们可以减少压力，提高注意力，并增强整体健康。从每天五分钟的冥想开始，专注于呼吸，让分散注意力的想法离去。',
                tags: ['正念', '健康', '心理健康']
            },
            'ja': {
                title: 'マインドフルネス生活の芸術',
                content: 'マインドフルネスは現在の瞬間に完全に存在し、関与する実践です。それは私たちの思考、感情、周囲に判断なく注意を払うことを含みます。マインドフルネスを育てることで、私たちはストレスを減らし、集中力を改善し、全体的な健康を強化できます。毎日たった5分の瞑想から始め、呼吸に集中し、気が散る思考を放す。',
                tags: ['マインドフルネス', 'ウェルネス', 'メンタルヘルス']
            },
            'bn': {
                title: 'মাইন্ডফুল লিভিংয়ের শিল্প',
                content: 'মাইন্ডফুলনেস হলো বর্তমান মুহূর্তে সম্পূর্ণ উপস্থিত এবং জড়িত থাকার অনুশীলন। এটি বিচার ছাড়াই আমাদের চিন্তাভাবনা, অনুভূতি এবং পরিবেশের প্রতি মনোযোগ দেওয়া জড়িত। মাইন্ডফুলনেস চাষ করে, আমরা স্ট্রেস কমাতে পারি, ফোকাস উন্নত করতে পারি এবং আমাদের সামগ্রিক সুস্থতা বাড়াতে পারি। প্রতিদিন মাত্র পাঁচ মিনিটের মেডিটেশন দিয়ে শুরু করুন, আপনার শ্বাসে ফোকাস করে এবং বিভ্রান্তিকর চিন্তাভাবনা ছেড়ে দিন।',
                tags: ['মাইন্ডফুলনেস', 'সুস্থতা', 'মানসিক স্বাস্থ্য']
            },
            'hi': {
                title: 'माइंडफुल लिविंग की कला',
                content: 'माइंडफुलनेस वर्तमान क्षण में पूरी तरह से उपस्थित और व्यस्त रहने का अभ्यास है। इसमें हमारे विचारों, भावनाओं और आसपास के वातावरण पर बिना किसी निर्णय के ध्यान देना शामिल है। माइंडफुलनेस को विकसित करके, हम तनाव कम कर सकते हैं, फोकस में सुधार कर सकते हैं और अपनी समग्र भलाई बढ़ा सकते हैं। प्रतिदिन सिर्फ पांच मिनट की ध्यान से शुरुआत करें, अपनी सांस पर ध्यान केंद्रित करते हुए और विचलित करने वाली विचारों को जाने दें।',
                tags: ['माइंडफुलनेस', 'कल्याण', 'मानसिक स्वास्थ्य']
            },
            'pt': {
                title: 'A Arte de Viver com Consciência',
                content: 'A atenção plena é a prática de estar totalmente presente e engajado no momento atual. Envolve prestar atenção aos nossos pensamentos, sentimentos e arredores sem julgamento. Ao cultivar a atenção plena, podemos reduzir o estresse, melhorar o foco e aprimorar nosso bem-estar geral. Comece com apenas cinco minutos de meditação por dia, concentrando-se na sua respiração e deixando ir pensamentos distrativos.',
                tags: ['atenção plena', 'bem-estar', 'saúde mental']
            }
        }
    },
    {
        id: 'sample-2',
        title: 'Embracing Change in Life',
        content: 'Change is an inevitable part of life, yet many of us resist it. Learning to embrace change can lead to personal growth and new opportunities. Instead of fearing the unknown, we can view change as a chance to learn, adapt, and discover new aspects of ourselves. Remember that every ending is also a beginning.',
        tags: ['change', 'growth', 'life lessons'],
        createdAt: new Date(Date.now() - 172800000),
        userId: 'demo-user-2',
        translations: {
            'en': {
                title: 'Embracing Change in Life',
                content: 'Change is an inevitable part of life, yet many of us resist it. Learning to embrace change can lead to personal growth and new opportunities. Instead of fearing the unknown, we can view change as a chance to learn, adapt, and discover new aspects of ourselves. Remember that every ending is also a beginning.',
                tags: ['change', 'growth', 'life lessons']
            },
            'es': {
                title: 'Abrazando el Cambio en la Vida',
                content: 'El cambio es una parte inevitable de la vida, sin embargo muchos de nosotros lo resistimos. Aprender a abrazar el cambio puede llevar al crecimiento personal y nuevas oportunidades. En lugar de temer lo desconocido, podemos ver el cambio como una oportunidad para aprender, adaptarnos y descubrir nuevos aspectos de nosotros mismos. Recuerda que cada final también es un principio.',
                tags: ['cambio', 'crecimiento', 'lecciones de vida']
            },
            'fr': {
                title: 'Embrasser le Changement dans la Vie',
                content: 'Le changement est une partie inévitable de la vie, pourtant beaucoup d\'entre nous lui résistons. Apprendre à embrasser le changement peut mener à la croissance personnelle et à de nouvelles opportunités. Au lieu de craindre l\'inconnu, nous pouvons voir le changement comme une chance d\'apprendre, de nous adapter et de découvrir de nouveaux aspects de nous-mêmes. Souvenez-vous que chaque fin est aussi un commencement.',
                tags: ['changement', 'croissance', 'leçons de vie']
            },
            'de': {
                title: 'Veränderung im Leben Annehmen',
                content: 'Veränderung ist ein unvermeidlicher Teil des Lebens, doch viele von uns widerstehen ihr. Das Lernen, Veränderung anzunehmen, kann zu persönlichem Wachstum und neuen Möglichkeiten führen. Anstatt das Unbekannte zu fürchten, können wir Veränderung als Chance sehen, zu lernen, uns anzupassen und neue Aspekte von uns selbst zu entdecken. Denken Sie daran, dass jedes Ende auch ein Anfang ist.',
                tags: ['veränderung', 'wachstum', 'lebenslektionen']
            },
            'zh': {
                title: '拥抱生活中的改变',
                content: '改变是生活中不可避免的一部分，但我们很多人却抵制它。学会拥抱改变可以带来个人成长和新机会。我们可以把改变视为学习、适应和发现自己新方面的机会，而不是害怕未知。记住，每一个结束也是一个开始。',
                tags: ['改变', '成长', '生活教训']
            },
            'ja': {
                title: '人生における変化を受け入れる',
                content: '変化は避けられず、しばしば不快ですが、それは成長の触媒でもあります。変化に抵抗するとき、私たちは不必要な苦しみを作り出します。代わりに、新しい経験と個人的な発展の機会としてそれを受け入れることを学ぶべきです。すべての終わりは新しい始まりであり、すべての挑戦はより強くなるチャンスです。',
                tags: ['変化', '成長', '個人的な発展']
            },
            'bn': {
                title: 'জীবনে পরিবর্তন গ্রহণ করা',
                content: 'পরিবর্তন জীবনের একটি অবশ্যম্ভাবী অংশ, তবুও আমাদের অনেকেই এটিকে প্রতিরোধ করে। পরিবর্তন গ্রহণ করতে শিখলে ব্যক্তিগত বৃদ্ধি এবং নতুন সুযোগ আসতে পারে। অজানাকে ভয় করার পরিবর্তে, আমরা পরিবর্তনকে শিখতে, খাপ খাইয়ে নিতে এবং নিজেদের নতুন দিক আবিষ্কার করার সুযোগ হিসেবে দেখতে পারি। মনে রাখবেন যে প্রতিটি শেষও একটি শুরু।',
                tags: ['পরিবর্তন', 'বৃদ্ধি', 'জীবনের শিক্ষা']
            },
            'hi': {
                title: 'जीवन में बदलाव को अपनाना',
                content: 'बदलाव जीवन का एक अपरिहार्य हिस्सा है, फिर भी हममें से कई लोग इसे रोकते हैं। बदलाव को अपनाना सीखना व्यक्तिगत विकास और नए अवसरों की ओर ले जा सकता है। अज्ञात से डरने के बजाय, हम बदलाव को सीखने, अनुकूलन करने और अपने नए पहलुओं की खोज करने का मौका देख सकते हैं। याद रखें कि हर अंत भी एक शुरुआत है।',
                tags: ['बदलाव', 'विकास', 'जीवन की सीख']
            },
            'pt': {
                title: 'Abraçando a Mudança na Vida',
                content: 'A mudança é uma parte inevitável da vida, no entanto muitos de nós a resistimos. Aprender a abraçar a mudança pode levar ao crescimento pessoal e novas oportunidades. Em vez de temer o desconhecido, podemos ver a mudança como uma chance de aprender, adaptar e descobrir novos aspectos de nós mesmos. Lembre-se de que todo fim também é um começo.',
                tags: ['mudança', 'crescimento', 'lições de vida']
            }
        }
    },
    {
        id: 'sample-3',
        title: 'The Power of Gratitude',
        content: 'Practicing gratitude can transform our perspective on life. When we focus on what we have rather than what we lack, we cultivate happiness and contentment. Start a daily gratitude journal where you write down three things you\'re thankful for each day. This simple practice can shift your mindset and improve your overall well-being.',
        tags: ['gratitude', 'happiness', 'mindset'],
        createdAt: new Date(Date.now() - 259200000),
        userId: 'demo-user-3',
        translations: {
            'en': {
                title: 'The Power of Gratitude',
                content: 'Practicing gratitude can transform our perspective on life. When we focus on what we have rather than what we lack, we cultivate happiness and contentment. Start a daily gratitude journal where you write down three things you\'re thankful for each day. This simple practice can shift your mindset and improve your overall well-being.',
                tags: ['gratitude', 'happiness', 'mindset']
            },
            'es': {
                title: 'El Poder de la Gratitud',
                content: 'Practicar la gratitud puede transformar nuestra perspectiva de la vida. Cuando nos enfocamos en lo que tenemos en lugar de lo que nos falta, cultivamos la felicidad y el contentamiento. Comienza un diario de gratitud diario donde escribas tres cosas por las que estás agradecido cada día. Esta práctica simple puede cambiar tu mentalidad y mejorar tu bienestar general.',
                tags: ['gratitud', 'felicidad', 'mentalidad']
            },
            'fr': {
                title: 'Le Pouvoir de la Gratitude',
                content: 'Pratiquer la gratitude peut transformer notre perspective sur la vie. Lorsque nous nous concentrons sur ce que nous avons plutôt que sur ce qui nous manque, nous cultivons le bonheur et la satisfaction. Tenir un journal de gratitude nous aide à remarquer les petites joies et bénédictions qui nous entourent quotidiennement. La gratitude change notre état d\'esprit de pénurie à abondance.',
                tags: ['gratitude', 'bonheur', 'état d\'esprit']
            },
            'de': {
                title: 'Die Kraft der Dankbarkeit',
                content: 'Die Praxis der Dankbarkeit kann unsere Perspektive auf das Leben verändern. Wenn wir uns auf das konzentrieren, was wir haben, anstatt auf das, was uns fehlt, kultivieren wir Glück und Zufriedenheit. Ein Dankbarkeitstagebuch zu führen hilft uns, die kleinen Freuden und Segnungen zu bemerken, die uns täglich umgeben. Dankbarkeit verschiebt unsere Denkweise von Mangel zu Fülle.',
                tags: ['dankbarkeit', 'glück', 'denkweise']
            },
            'zh': {
                title: '感恩的力量',
                content: '练习感恩可以改变我们对生活的看法。当我们专注于我们拥有的而不是我们缺少的，我们培养幸福和满足感。保持感恩日记帮助我们注意到每天围绕我们的小快乐和祝福。感恩将我们的心态从匮乏转向丰富。',
                tags: ['感恩', '幸福', '心态']
            },
            'ja': {
                title: '感謝の力',
                content: '感謝を実践することは、私たちの人生観を変えることができます。私たちが欠けているものではなく持っているものに焦点を当てる時、私たちは幸福と満足を育みます。感謝の日記をつけることは、私たちを毎日囲む小さな喜びと祝福に気づかせてくれます。感謝は私たちの心構えを欠乏から豊かさへとシフトさせます。',
                tags: ['感謝', '幸福', '心構え']
            },
            'bn': {
                title: 'কৃতজ্ঞতার শক্তি',
                content: 'কৃতজ্ঞতা অনুশীলন আমাদের জীবনের দৃষ্টিভঙ্গি পরিবর্তন করতে পারে। যখন আমরা আমাদের কাছে যা আছে তার উপর ফোকাস করি, তখন আমরা সুখ এবং সন্তুষ্টি লালন করি। প্রতিদিন তিনটি জিনিস লিখে একটি দৈনিক কৃতজ্ঞতা জার্নাল শুরু করুন যার জন্য আপনি কৃতজ্ঞ। এই সহজ অনুশীলন আপনার মানসিকতা পরিবর্তন করতে পারে এবং আপনার সামগ্রিক সুস্থতা উন্নত করতে পারে।',
                tags: ['কৃতজ্ঞতা', 'সুখ', 'মানসিকতা']
            },
            'hi': {
                title: 'कृतज्ञता की शक्ति',
                content: 'कृतज्ञता का अभ्यास हमारे जीवन की दृष्टि को बदल सकता है। जब हम उस पर ध्यान केंद्रित करते हैं जो हमारे पास है, बजाय उसकी जो हमारे पास नहीं है, तो हम खुशी और संतुष्टि को बढ़ावा देते हैं। एक दैनिक कृतज्ञता पत्रिका शुरू करें जहां आप प्रतिदिन तीन चीजें लिखें जिनके लिए आप आभारी हैं। यह सरल अभ्यास आपके मानसिकता को बदल सकता है और आपके समग्र कल्याण में सुधार कर सकता है।',
                tags: ['कृतज्ञता', 'खुशी', 'मानसिकता']
            },
            'pt': {
                title: 'O Poder da Gratidão',
                content: 'Praticar a gratidão pode transformar nossa perspectiva sobre a vida. Quando nos concentramos no que temos em vez do que nos falta, cultivamos a felicidade e a satisfação. Comece um diário diário de gratidão onde você escreve três coisas pelas quais você é grato todos os dias. Esta prática simples pode mudar sua mentalidade e melhorar seu bem-estar geral.',
                tags: ['gratidão', 'felicidade', 'mentalidade']
            }
        }
    }
];

// Initialize Journal Module
export function initJournal(containerId = 'journals-container') {
    journalsContainer = document.getElementById(containerId);

    journalForm = document.getElementById('journalForm');
    searchInput = document.getElementById('journalSearch');
    filterSelect = document.getElementById('journalFilter');

    setupAuthListener();

    if (journalForm) {
        journalForm.addEventListener('submit', handleJournalSubmit);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterJournals, 300));
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterJournals);
    }

    if (journalsContainer) {
        journalsContainer.addEventListener('click', handleJournalActionClick);
        journalsContainer.addEventListener('click', handleReadMoreClick);
    }

    // Add event listener for create journal button
    const createJournalBtn = document.getElementById('createJournalBtn');
    if (createJournalBtn) {
        createJournalBtn.addEventListener('click', createNewJournal);
    }

    // Add event listeners for modal close and cancel buttons
    const modal = document.getElementById('journalModal');
    if (modal) {
        const modalCloseBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => closeModal(modal));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(modal));
        }

        // Close modal when clicking on backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }

    // Apply saved language translation to journal page
    setTimeout(() => {
        if (window.translatePage && window.accessibilityState && window.accessibilityState.currentLanguage && window.accessibilityState.currentLanguage !== 'en') {
            window.translatePage(window.accessibilityState.currentLanguage);
        }
    }, 100);

    // Also apply translation after journal content loads
    setTimeout(() => {
        if (window.translatePage && window.accessibilityState && window.accessibilityState.currentLanguage && window.accessibilityState.currentLanguage !== 'en') {
            window.translatePage(window.accessibilityState.currentLanguage);
        }
    }, 1000);

    // Listen for language changes to re-render journal content
    window.addEventListener('languageChanged', async () => {
        // Translate all journals to the new language
        const targetLang = window.accessibilityState?.currentLanguage || 'en';
        await translateAllJournals(targetLang);

        // Re-render current journal display with new language
        if (currentUser) {
            displayCombinedJournals();
        } else {
            displayJournals(allJournals.length > 0 ? allJournals : SAMPLE_JOURNALS, false);
        }

        // Update modal content if it's open
        updateModalTranslations();
    });


}

function handleJournalActionClick(e) {
    const button = e.target.closest('.journal-action-btn');
    if (!button) return;

    const action = button.dataset.action;
    const journalId = button.dataset.journalId;

    if (action === 'edit') {
        editJournal(journalId);
    } else if (action === 'delete') {
        deleteJournal(journalId);
    }
}

function handleReadMoreClick(e) {
    const readMoreIndicator = e.target.closest('.read-more-indicator');
    if (!readMoreIndicator) return;

    const excerptDiv = readMoreIndicator.closest('.journal-excerpt');
    if (!excerptDiv) return;

    const fullContent = excerptDiv.getAttribute('data-full-content');
    if (!fullContent) return;

    // Toggle between excerpt and full content
    if (excerptDiv.classList.contains('expanded')) {
        // Collapse back to excerpt
        const excerpt = fullContent.length > 150 ? fullContent.substring(0, 150) + '...' : fullContent;
        excerptDiv.innerHTML = `${escapeHtml(excerpt)}${fullContent.length > 150 ? '<span class="read-more-indicator" data-i18n="Keep reading">Keep reading</span>' : ''}`;
        excerptDiv.classList.remove('expanded');
    } else {
        // Expand to full content
        excerptDiv.innerHTML = escapeHtml(fullContent);
        excerptDiv.classList.add('expanded');
    }
}

function createNewJournal() {
    // Clear the form for new journal creation
    document.getElementById('journalId').value = '';
    document.getElementById('journalTitle').value = '';
    document.getElementById('journalContent').value = '';
    document.getElementById('journalTags').value = '';

    const modal = document.getElementById('journalModal');
    if (modal) {
        openModal(modal);
        document.getElementById('modalTitle').textContent = 'Create New Journal';
    }
}

function setupAuthListener() {
    // Use the centralized auth state listener instead of direct Firebase listener
    import('./auth.js').then(({ addAuthStateListener }) => {
        addAuthStateListener((user) => {
            currentUser = user;
            if (user) {
                console.log('User logged in:', user.uid);
                // Load both user journals AND all journals so logged users can see all content
                loadUserJournals();
                loadAllJournals();
                if (journalsContainer) {
                    journalsContainer.style.display = 'block';
                }
            } else {
                console.log('No user logged in');
                // For guests, show sample journals immediately
                displayJournals(SAMPLE_JOURNALS, false);
            }
        });
    }).catch(error => {
        console.error('Error importing auth module:', error);
        // Fallback to showing sample journals
        if (journalsContainer) {
            displayJournals(SAMPLE_JOURNALS, false);
        }
    });
}

async function loadUserJournals() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, 'journals'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        userJournals = [];

        querySnapshot.forEach((doc) => {
            userJournals.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // After loading user journals, display combined view (all journals + sample)
        displayCombinedJournals();
    } catch (error) {
        console.error('Error loading user journals from Firestore:', error);

        // Fallback: load from localStorage
        try {
            const localJournals = JSON.parse(localStorage.getItem('localJournals') || '[]');
            userJournals = localJournals.filter(j => j.userId === currentUser.uid);
            console.log('Loaded journals from localStorage:', userJournals.length);

            // Display combined view with local journals
            displayCombinedJournals();
        } catch (localError) {
            console.error('Error loading local journals:', localError);
            showMessage('Error loading your journals', 'error');
            // Ensure loading state is cleared even on error
            displayCombinedJournals();
        }
    }
}

async function loadAllJournals() {
    try {
        const q = query(
            collection(db, 'journals'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        allJournals = [];
        
        querySnapshot.forEach((doc) => {
            allJournals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // If user is logged in, don't display here - displayCombinedJournals will handle it
        if (currentUser) {
            console.log('User logged in, displaying combined journals');
            displayCombinedJournals();
        } else if (allJournals.length === 0) {
            console.log('No journals found in Firebase, showing sample journals');
            displayJournals(SAMPLE_JOURNALS, false);
        } else {
            displayJournals(allJournals, false);
        }
    } catch (error) {
        console.error('Error loading all journals:', error);
        if (!currentUser) {
            displayJournals(SAMPLE_JOURNALS, false);
        }
    }
}

function getThemeForJournal(journalId, index) {
    if (journalId && !journalId.startsWith('sample-')) {
        const hash = journalId.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        return CARD_THEMES[Math.abs(hash) % CARD_THEMES.length];
    }
    return CARD_THEMES[index % CARD_THEMES.length];
}

/**
 * Get translated data for a journal (used for sample journals and dynamically translated user journals)
 */
function getTranslatedJournalData(journal, lang) {
    // If it's a sample journal with translations, use those
    if (journal.id.startsWith('sample-') && journal.translations && journal.translations[lang]) {
        const translation = journal.translations[lang];
        return {
            title: translation.title || journal.title,
            content: translation.content || journal.content,
            tags: translation.tags || journal.tags
        };
    }

    // For user journals, check if translations exist
    if (journal.translations && journal.translations[lang]) {
        const translation = journal.translations[lang];
        return {
            title: translation.title || journal.title,
            content: translation.content || journal.content,
            tags: translation.tags || journal.tags
        };
    }

    // If no translation available, return original data
    return {
        title: journal.title,
        content: journal.content,
        tags: journal.tags
    };
}

/**
 * Placeholder translation function - simulates translation for demonstration
 * In a real implementation, this would use Google Translate API or similar
 */
function translateText(text, fromLang, toLang) {
    if (!text || fromLang === toLang) return text;

    // Simple placeholder translations for demonstration
    const placeholders = {
        'en': {
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'es': {
            'en': '[EN] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'fr': {
            'en': '[EN] ',
            'es': '[ES] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'de': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'zh': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'ja': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'bn': '[BN] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'bn': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'hi': '[HI] ',
            'pt': '[PT] '
        },
        'hi': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'pt': '[PT] '
        },
        'pt': {
            'en': '[EN] ',
            'es': '[ES] ',
            'fr': '[FR] ',
            'de': '[DE] ',
            'zh': '[ZH] ',
            'ja': '[JA] ',
            'bn': '[BN] ',
            'hi': '[HI] '
        }
    };

    const prefix = placeholders[fromLang]?.[toLang] || `[${toLang.toUpperCase()}] `;
    return prefix + text;
}

/**
 * Translate a journal post to a specific language and store the translation
 */
async function translateJournal(journal, targetLang) {
    const currentLang = window.accessibilityState?.currentLanguage || 'en';

    // Don't translate if already in target language or if it's a sample journal
    if (currentLang === targetLang || journal.id.startsWith('sample-')) {
        return journal;
    }

    // Initialize translations object if it doesn't exist
    if (!journal.translations) {
        journal.translations = {};
    }

    // Check if translation already exists
    if (journal.translations[targetLang]) {
        return journal;
    }

    try {
        // Translate title and content
        const translatedTitle = translateText(journal.title, currentLang, targetLang);
        const translatedContent = translateText(journal.content, currentLang, targetLang);
        const translatedTags = journal.tags ? journal.tags.map(tag => translateText(tag, currentLang, targetLang)) : [];

        // Store translation
        journal.translations[targetLang] = {
            title: translatedTitle,
            content: translatedContent,
            tags: translatedTags
        };

        // Save translation to database if it's a Firestore journal
        if (!journal.id.startsWith('local-') && !journal.id.startsWith('sample-')) {
            try {
                await updateDoc(doc(db, 'journals', journal.id), {
                    translations: journal.translations,
                    updatedAt: serverTimestamp()
                });
            } catch (error) {
                console.warn('Failed to save translation to Firestore:', error);
                // Save to localStorage as fallback
                saveTranslationToLocalStorage(journal.id, targetLang, journal.translations[targetLang]);
            }
        } else if (journal.id.startsWith('local-')) {
            // Save to localStorage for local journals
            saveTranslationToLocalStorage(journal.id, targetLang, journal.translations[targetLang]);
        }

        return journal;
    } catch (error) {
        console.error('Error translating journal:', error);
        return journal;
    }
}

/**
 * Save translation to localStorage for offline journals
 */
function saveTranslationToLocalStorage(journalId, lang, translation) {
    try {
        const translations = JSON.parse(localStorage.getItem('journalTranslations') || '{}');
        if (!translations[journalId]) {
            translations[journalId] = {};
        }
        translations[journalId][lang] = translation;
        localStorage.setItem('journalTranslations', JSON.stringify(translations));
    } catch (error) {
        console.error('Failed to save translation to localStorage:', error);
    }
}

/**
 * Load translations from localStorage
 */
function loadTranslationsFromLocalStorage(journalId) {
    try {
        const translations = JSON.parse(localStorage.getItem('journalTranslations') || '{}');
        return translations[journalId] || {};
    } catch (error) {
        console.error('Failed to load translations from localStorage:', error);
        return {};
    }
}

/**
 * Translate all visible journals to the current language
 */
async function translateAllJournals(targetLang) {
    const currentLang = window.accessibilityState?.currentLanguage || 'en';

    if (currentLang === targetLang) return;

    // Show loading indicator
    showMessage('Translating journals...', 'info');

    try {
        // Translate user journals
        for (let i = 0; i < userJournals.length; i++) {
            userJournals[i] = await translateJournal(userJournals[i], targetLang);
        }

        // Translate all journals
        for (let i = 0; i < allJournals.length; i++) {
            allJournals[i] = await translateJournal(allJournals[i], targetLang);
        }

        // Re-display journals with translations
        if (currentUser) {
            displayCombinedJournals();
        } else {
            displayJournals(allJournals.length > 0 ? allJournals : SAMPLE_JOURNALS, false);
        }

        showMessage('Journals translated successfully!', 'success');
    } catch (error) {
        console.error('Error translating journals:', error);
        showMessage('Error translating journals', 'error');
    }
}

/**
 * Display combined journals (all journals + sample journals) for logged in users
 * User's own journals have edit/delete buttons, others are read-only
 */
function displayCombinedJournals() {
    if (!journalsContainer) return;

    // Clean up existing TTS handlers before re-rendering
    cleanupJournalTTS();

    // Combine all Firebase journals, local journals, and sample journals
    let localJournals = [];
    try {
        localJournals = JSON.parse(localStorage.getItem('localJournals') || '[]');
    } catch (error) {
        console.error('Error parsing localStorage journals:', error);
        localJournals = [];
    }
    const combinedJournals = [...allJournals, ...localJournals, ...SAMPLE_JOURNALS];

    if (combinedJournals.length === 0) {
        journalsContainer.innerHTML = `
            <div class="no-journals">
                <p>No journals yet</p>
                <p>Create your first journal to get started</p>
            </div>
        `;
        return;
    }

    journalsContainer.innerHTML = combinedJournals.map((journal, index) => {
        const theme = getThemeForJournal(journal.id, index);

        // Get translated content for sample journals
        const currentLang = window.accessibilityState?.currentLanguage || 'en';
        const translatedData = getTranslatedJournalData(journal, currentLang);
        const excerpt = translatedData.content ? translatedData.content.substring(0, 150) : '';
        const isLongContent = translatedData.content && translatedData.content.length > 150;
        const readTime = getReadTime(translatedData.content);
        const formattedDate = formatDate(journal.createdAt);
        const isOwner = journal.userId === currentUser?.uid;
        const titleText = translatedData.title || 'Untitled';
        const contentText = translatedData.content || '';
        // Escape quotes and other special characters for HTML attributes
        const escapedTitleText = titleText;
        const escapedContentText = contentText;

        return `
        <article class="journal-card attractive-journal-card" data-journal-id="${journal.id}" style="--card-theme: ${theme}">
            <div class="journal-card-gradient"></div>
            <div class="journal-card-content">
                <header class="journal-header">
                    <div class="journal-title-wrapper">
                        ${!journal.id.startsWith('sample-') ? `<span class="tts-indicator" title="Hover to listen">
                            <i class="fas fa-volume-up"></i>
                        </span>` : ''}
                        <h3 class="journal-title" data-tts="${escapedTitleText}">
                            ${escapeHtml(translatedData.title || 'Untitled')}
                        </h3>
                    </div>
                    <div class="journal-meta">
                        <span class="journal-date">
                            <i class="far fa-calendar-alt"></i>
                            ${formattedDate}
                        </span>
                        <span class="journal-read-time">
                            <i class="far fa-clock"></i>
                            ${readTime}
                        </span>
                    </div>
                    ${isOwner ? `
                        <span class="journal-badge owner-badge">
                            <i class="fas fa-user"></i> <span data-i18n="Your Post">Your Post</span>
                        </span>
                    ` : ''}
                </header>

                <div class="journal-excerpt" data-tts="${escapedContentText}" data-full-content="${escapeHtml(translatedData.content || journal.content)}">
                    ${escapeHtml(excerpt)}${isLongContent ? '...' : ''}
                    ${isLongContent ? `<span class="read-more-indicator" data-i18n="Keep reading">Keep reading</span>` : ''}
                </div>

                ${journal.tags && journal.tags.length > 0 ? `
                    <div class="journal-tags">
                        ${journal.tags.map(tag => `<span class="tag"><i class="fas fa-tag"></i> ${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="journal-card-actions">
                    ${isOwner ? `
                        <button class="btn btn-edit journal-action-btn" data-action="edit" data-journal-id="${journal.id}" aria-label="Edit journal">
                            <i class="fas fa-edit"></i> <span data-i18n="Edit">Edit</span>
                        </button>
                        <button class="btn btn-delete journal-action-btn" data-action="delete" data-journal-id="${journal.id}" aria-label="Delete journal">
                            <i class="fas fa-trash"></i> <span data-i18n="Delete">Delete</span>
                        </button>
                    ` : `
                        <span class="guest-indicator">
                            <i class="fas fa-lock"></i> <span data-i18n="Read only">Read only</span>
                        </span>
                    `}
                </div>
            </div>
            <div class="journal-card-decoration">
                <div class="decoration-circle"></div>
            </div>
        </article>
        `;
    }).join('');

    // Setup TTS for dynamically loaded journal content
    // Use setTimeout to ensure DOM is fully updated before setting up TTS
    setTimeout(() => {
        if (typeof window.setupTTS === 'function') {
            window.setupTTS();
        }
    }, 0);
}

function getReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content ? content.split(/\s+/).length : 0;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes < 1 ? '1 min read' : `${minutes} min read`;
}

function displayJournals(journals, showEditDelete = false) {
    if (!journalsContainer) return;
    
    if (journals.length === 0) {
        journalsContainer.innerHTML = `
            <div class="no-journals">
                <p>No journals yet</p>
                <p>Create your first journal to get started</p>
            </div>
        `;
        return;
    }
    
    journalsContainer.innerHTML = journals.map((journal, index) => {
        const theme = getThemeForJournal(journal.id, index);

        // Get translated content for sample journals
        const currentLang = window.accessibilityState?.currentLanguage || 'en';
        const translatedData = getTranslatedJournalData(journal, currentLang);
        const excerpt = translatedData.content ? translatedData.content.substring(0, 150) : '';
        const isLongContent = translatedData.content && translatedData.content.length > 150;
        const readTime = getReadTime(translatedData.content);
        const formattedDate = formatDate(journal.createdAt);
        const isOwner = journal.userId === currentUser?.uid;
        const titleText = translatedData.title || 'Untitled';
        const contentText = translatedData.content || '';
        // Escape quotes and other special characters for HTML attributes
        const escapedTitleText = titleText.replace(/&/g, '&amp;').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
        const escapedContentText = contentText.replace(/&/g, '&amp;').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');

        return `
        <article class="journal-card attractive-journal-card" data-journal-id="${journal.id}" style="--card-theme: ${theme}">
            <div class="journal-card-gradient"></div>
            <div class="journal-card-content">
                <header class="journal-header">
                    <div class="journal-title-wrapper">
                        <span class="tts-indicator" title="Hover to listen">
                            <i class="fas fa-volume-up"></i>
                        </span>
                        <h3 class="journal-title" data-tts="${escapedTitleText}">
                            ${escapeHtml(translatedData.title || 'Untitled')}
                        </h3>
                    </div>
                    <div class="journal-meta">
                        <span class="journal-date">
                            <i class="far fa-calendar-alt"></i>
                            ${formattedDate}
                        </span>
                        <span class="journal-read-time">
                            <i class="far fa-clock"></i>
                            ${readTime}
                        </span>
                    </div>
                    ${isOwner ? `
                        <span class="journal-badge owner-badge">
                            <i class="fas fa-user"></i> Your Post
                        </span>
                    ` : ''}
                </header>

                <div class="journal-excerpt" data-tts="${escapedContentText}" data-full-content="${escapeHtml(translatedData.content || journal.content)}">
                    ${escapeHtml(excerpt)}${isLongContent ? '...' : ''}
                    ${isLongContent ? `<span class="read-more-indicator" data-i18n="Keep reading">Keep reading</span>` : ''}
                </div>

                ${journal.tags && journal.tags.length > 0 ? `
                    <div class="journal-tags">
                        ${journal.tags.map(tag => `<span class="tag"><i class="fas fa-tag"></i> ${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="journal-card-actions">
                    ${showEditDelete ? `
                        <button class="btn btn-edit journal-action-btn" data-action="edit" data-journal-id="${journal.id}" aria-label="Edit journal">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete journal-action-btn" data-action="delete" data-journal-id="${journal.id}" aria-label="Delete journal">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : `
                        <span class="guest-indicator">
                            <i class="fas fa-lock"></i> Read only
                        </span>
                    `}
                </div>
            </div>
            <div class="journal-card-decoration">
                <div class="decoration-circle"></div>
            </div>
        </article>
        `;
    }).join('');

    // Setup TTS for dynamically loaded journal content
    // Use setTimeout to ensure DOM is fully updated before setting up TTS
    setTimeout(() => {
        if (typeof window.setupTTS === 'function') {
            window.setupTTS();
        }
    }, 0);
}

async function handleJournalSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showMessage('Please log in to create a journal', 'error');
        return;
    }

    const journalId = document.getElementById('journalId').value;
    const title = document.getElementById('journalTitle').value.trim();
    const content = document.getElementById('journalContent').value.trim();
    const tagsInput = document.getElementById('journalTags').value.trim();

    if (!title || !content) {
        showMessage('Please fill in both title and content', 'error');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Show loading state
    showLoading('journalSubmitBtn');

    try {
        if (journalId) {
            // Check if this is a localStorage journal
            if (journalId.startsWith('local-')) {
                try {
                    // Update localStorage directly for local journals
                    saveJournalToLocalStorage({ id: journalId, title, content, tags, userId: currentUser.uid, createdAt: new Date(), updatedAt: new Date() });

                    // Update the journal in userJournals array immediately for instant UI update
                    const journalIndex = userJournals.findIndex(j => j.id === journalId);
                    if (journalIndex >= 0) {
                        userJournals[journalIndex] = {
                            ...userJournals[journalIndex],
                            title,
                            content,
                            tags,
                            updatedAt: new Date()
                        };
                    }

                    displayCombinedJournals();

                    showMessage('Journal updated locally!', 'success');
                } catch (localError) {
                    console.error('Error updating localStorage journal:', localError);
                    showMessage('Error updating journal locally: ' + localError.message, 'error');
                }
            } else {
                // For Firestore journals, try Firestore first, fallback to localStorage
                try {
                    // Add timeout to prevent hanging
                    const updatePromise = updateJournal(journalId, { title, content, tags });
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Update timeout')), 5000)
                    );
                    const result = await Promise.race([updatePromise, timeoutPromise]);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to update journal');
                    }

                    // Update the journal in userJournals array immediately for instant UI update
                    const journalIndex = userJournals.findIndex(j => j.id === journalId);
                    if (journalIndex >= 0) {
                        userJournals[journalIndex] = {
                            ...userJournals[journalIndex],
                            title,
                            content,
                            tags,
                            updatedAt: new Date()
                        };
                    }

                    // Update in allJournals as well for UI update
                    const allIndex = allJournals.findIndex(j => j.id === journalId);
                    if (allIndex >= 0) {
                        allJournals[allIndex] = {
                            ...allJournals[allIndex],
                            title,
                            content,
                            tags,
                            updatedAt: new Date()
                        };
                    }

                    displayCombinedJournals();

                    showMessage('Journal updated successfully!', 'success');
                } catch (firestoreError) {
                    console.warn('Firestore update failed, saving to localStorage:', firestoreError);

                    // Save to localStorage as fallback
                    saveJournalToLocalStorage({ id: journalId, title, content, tags, userId: currentUser.uid, createdAt: new Date(), updatedAt: new Date() });

                    // Update the journal in userJournals array immediately for instant UI update
                    const journalIndex = userJournals.findIndex(j => j.id === journalId);
                    if (journalIndex >= 0) {
                        userJournals[journalIndex] = {
                            ...userJournals[journalIndex],
                            title,
                            content,
                            tags,
                            updatedAt: new Date()
                        };
                    }

                    // Remove from allJournals if it exists there to avoid duplicates
                    const allIndex = allJournals.findIndex(j => j.id === journalId);
                    if (allIndex >= 0) {
                        allJournals.splice(allIndex, 1);
                    }

                    displayCombinedJournals();

                    showMessage('Journal updated locally! Will sync when online.', 'success');
                }
            }
        } else {
            console.log('Creating new journal with data:', { userId: currentUser.uid, title, content, tags });

            try {
                // Try Firestore with a short timeout
                const addDocPromise = addDoc(collection(db, 'journals'), {
                    userId: currentUser.uid,
                    title,
                    content,
                    tags,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Firestore timeout')), 3000)
                );
                const docRef = await Promise.race([addDocPromise, timeoutPromise]);
                console.log('Journal created successfully with ID:', docRef.id);

                // Add to userJournals immediately for instant UI update
                userJournals.unshift({
                    id: docRef.id,
                    userId: currentUser.uid,
                    title,
                    content,
                    tags,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                displayCombinedJournals();

                showMessage('Journal created successfully!', 'success');
            } catch (firestoreError) {
                console.warn('Firestore save failed, saving to localStorage:', firestoreError);
                // Save to localStorage as fallback
                const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const newJournal = { id: localId, title, content, tags, userId: currentUser.uid, createdAt: new Date(), updatedAt: new Date() };
                saveJournalToLocalStorage(newJournal);

                // Add to userJournals immediately for instant UI update
                userJournals.unshift(newJournal);
                displayCombinedJournals();

                showMessage('Journal saved locally! Will sync when online.', 'success');
            }
        }

        // Load journals in background
        loadUserJournals().catch(error => {
            console.error('Error loading journals after save:', error);
        });

    } catch (error) {
        console.error('Error saving journal:', error);
        showMessage('Error saving journal: ' + error.message, 'error');
    } finally {
        // Always clear loading state and reset form/close modal
        hideLoading('journalSubmitBtn');

        // Reset form and close modal
        e.target.reset();
        document.getElementById('journalId').value = '';

        const modal = document.getElementById('journalModal');
        if (modal) {
            closeModal(modal);
        }
    }
}

export async function editJournal(journalId) {
    // Search in all possible journal sources: userJournals, allJournals, and localStorage
    let journal = userJournals.find(j => j.id === journalId);

    if (!journal) {
        // Check allJournals
        journal = allJournals.find(j => j.id === journalId);
    }

    if (!journal) {
        // Check localStorage journals
        try {
            const localJournals = JSON.parse(localStorage.getItem('localJournals') || '[]');
            journal = localJournals.find(j => j.id === journalId);
        } catch (error) {
            console.error('Error checking localStorage for journal:', error);
        }
    }

    if (!journal) {
        showMessage('Journal not found or has been deleted', 'error');
        return;
    }

    // Check if user owns this journal
    if (journal.userId !== currentUser?.uid) {
        showMessage('You can only edit your own journals', 'error');
        return;
    }

    document.getElementById('journalId').value = journalId;
    document.getElementById('journalTitle').value = journal.title || '';
    document.getElementById('journalContent').value = journal.content || '';
    document.getElementById('journalTags').value = (journal.tags || []).join(', ');

    const modal = document.getElementById('journalModal');
    if (modal) {
        openModal(modal);
        document.getElementById('modalTitle').textContent = 'Edit Journal';
    }
}

export async function deleteJournal(journalId) {
    if (!confirm('Are you sure you want to delete this journal?')) {
        return;
    }

    try {
        // Check if it's a localStorage journal (starts with 'local-')
        if (journalId.startsWith('local-')) {
            // Delete from localStorage
            try {
                const localJournals = JSON.parse(localStorage.getItem('localJournals') || '[]');
                const updatedJournals = localJournals.filter(j => j.id !== journalId);
                localStorage.setItem('localJournals', JSON.stringify(updatedJournals));

                // Remove from userJournals array immediately for instant UI update
                userJournals = userJournals.filter(j => j.id !== journalId);
                displayCombinedJournals();

                showMessage('Journal deleted successfully', 'success');
                return;
            } catch (localError) {
                console.error('Error deleting from localStorage:', localError);
                showMessage('Error deleting journal from local storage', 'error');
                return;
            }
        }

        // Try to delete from Firestore
        await deleteDoc(doc(db, 'journals', journalId));

        // Remove from userJournals array immediately for instant UI update
        userJournals = userJournals.filter(j => j.id !== journalId);
        displayCombinedJournals();

        showMessage('Journal deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting journal:', error);
        showMessage('Error deleting journal: ' + error.message, 'error');
    }
}

function filterJournals() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterType = filterSelect ? filterSelect.value : 'recent';
    
    // For logged in users, search through combined journals (all + samples)
    // For guests, search through allJournals
    let searchPool = currentUser ? [...allJournals, ...SAMPLE_JOURNALS] : [...allJournals];
    
    let filteredJournals = searchPool;
    
    if (filteredJournals.length === 0) {
        filteredJournals = [...SAMPLE_JOURNALS];
    }
    
    if (searchTerm) {
        filteredJournals = filteredJournals.filter(journal =>
            (journal.title && journal.title.toLowerCase().includes(searchTerm)) ||
            (journal.content && journal.content.toLowerCase().includes(searchTerm)) ||
            (journal.tags && journal.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (filterType === 'oldest') {
        filteredJournals.reverse();
    }
    
    // For logged in users, show edit/delete only on their own journals
    if (currentUser) {
        displayFilteredCombinedJournals(filteredJournals);
    } else {
        displayJournals(filteredJournals, false);
    }
}

/**
 * Display filtered combined journals for logged in users
 */
function displayFilteredCombinedJournals(journals) {
    if (!journalsContainer) return;

    if (journals.length === 0) {
        journalsContainer.innerHTML = `
            <div class="no-journals">
                <p>No journals found</p>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }

    journalsContainer.innerHTML = journals.map((journal, index) => {
        const theme = getThemeForJournal(journal.id, index);

        // Get translated content for sample journals
        const currentLang = window.accessibilityState?.currentLanguage || 'en';
        const translatedData = getTranslatedJournalData(journal, currentLang);
        const excerpt = translatedData.content ? translatedData.content.substring(0, 150) : '';
        const isLongContent = translatedData.content && translatedData.content.length > 150;
        const readTime = getReadTime(translatedData.content);
        const formattedDate = formatDate(journal.createdAt);
        const isOwner = journal.userId === currentUser?.uid;
        const titleText = translatedData.title || 'Untitled';
        const contentText = translatedData.content || '';
        // Escape quotes and other special characters for HTML attributes
        const escapedTitleText = titleText.replace(/&/g, '&amp;').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
        const escapedContentText = contentText.replace(/&/g, '&amp;').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');

        return `
        <article class="journal-card attractive-journal-card" data-journal-id="${journal.id}" style="--card-theme: ${theme}">
            <div class="journal-card-gradient"></div>
            <div class="journal-card-content">
                <header class="journal-header">
                    <div class="journal-title-wrapper">
                        <span class="tts-indicator" title="Hover to listen">
                            <i class="fas fa-volume-up"></i>
                        </span>
                        <h3 class="journal-title" data-tts="${escapedTitleText}">
                            ${escapeHtml(translatedData.title || 'Untitled')}
                        </h3>
                    </div>
                    <div class="journal-meta">
                        <span class="journal-date">
                            <i class="far fa-calendar-alt"></i>
                            ${formattedDate}
                        </span>
                        <span class="journal-read-time">
                            <i class="far fa-clock"></i>
                            ${readTime}
                        </span>
                    </div>
                    ${isOwner ? `
                        <span class="journal-badge owner-badge">
                            <i class="fas fa-user"></i> Your Post
                        </span>
                    ` : ''}
                </header>

                <div class="journal-excerpt" data-tts="${escapedContentText}">
                    ${escapeHtml(excerpt)}${isLongContent ? '...' : ''}
                    ${isLongContent ? `<span class="read-more-indicator" data-i18n="Keep reading">Keep reading</span>` : ''}
                </div>

                ${journal.tags && journal.tags.length > 0 ? `
                    <div class="journal-tags">
                        ${journal.tags.map(tag => `<span class="tag"><i class="fas fa-tag"></i> ${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="journal-card-actions">
                    ${isOwner ? `
                        <button class="btn btn-edit journal-action-btn" data-action="edit" data-journal-id="${journal.id}" aria-label="Edit journal">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete journal-action-btn" data-action="delete" data-journal-id="${journal.id}" aria-label="Delete journal">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : `
                        <span class="guest-indicator">
                            <i class="fas fa-lock"></i> Read only
                        </span>
                    `}
                </div>
            </div>
            <div class="journal-card-decoration">
                <div class="decoration-circle"></div>
            </div>
        </article>
        `;
    }).join('');

    // Setup TTS for dynamically loaded journal content
    // Use setTimeout to ensure DOM is fully updated before setting up TTS
    setTimeout(() => {
        if (typeof window.setupTTS === 'function') {
            window.setupTTS();
        }
    }, 0);
}

function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset submit button to normal state
    const submitBtn = modal.querySelector('#journalSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-i18n="Publish">Publish</span>';
    }

    const focusableElements = modal.querySelectorAll('button, input, textarea, select');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

window.editJournal = editJournal;
window.deleteJournal = deleteJournal;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    console.log('showLoading called for button:', buttonId, 'found:', !!btn);
    if (btn) {
        // Prevent multiple loading states from overwriting originalHTML
        if (!btn.dataset.originalHTML) {
            btn.dataset.originalHTML = btn.innerHTML;
        }
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        console.log('Loading state set for button:', buttonId);
    } else {
        console.error('Button not found for loading:', buttonId);
    }
}

function hideLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    console.log('hideLoading called for button:', buttonId, 'found:', !!btn, 'has originalHTML:', !!(btn && btn.dataset.originalHTML));
    if (btn && btn.dataset.originalHTML) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalHTML;
        delete btn.dataset.originalHTML;
        console.log('Loading state cleared for button:', buttonId);
    } else if (btn) {
        // Fallback: reset button if originalHTML is missing
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-i18n="Publish">Publish</span>';
        console.log('Fallback loading state reset for button:', buttonId);
    }
}

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
 * Save journal to localStorage as fallback when Firestore is unavailable
 */
function saveJournalToLocalStorage(journal) {
    try {
        const localJournals = JSON.parse(localStorage.getItem('localJournals') || '[]');
        const existingIndex = localJournals.findIndex(j => j.id === journal.id);

        if (existingIndex >= 0) {
            // Update existing
            localJournals[existingIndex] = { ...journal, updatedAt: new Date() };
        } else {
            // Add new
            localJournals.push(journal);
        }

        localStorage.setItem('localJournals', JSON.stringify(localJournals));
        console.log('Journal saved to localStorage:', journal.id);
    } catch (error) {
        console.error('Failed to save journal to localStorage:', error);
    }
}

/**
 * Clean up existing TTS handlers before re-rendering journal content
 */
function cleanupJournalTTS() {
    // Remove existing TTS handlers from all elements to prevent conflicts
    document.querySelectorAll('[data-tts]').forEach(el => {
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.classList.remove('tts-enabled');
    });

    // Also clean up any other TTS-related elements
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, .journal-content, .journal-title, .journal-excerpt, .card, .btn').forEach(el => {
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.classList.remove('tts-enabled');
    });
}

/**
 * Setup TTS for journal content elements
 * This function should be called after journal content is dynamically loaded
 */
function setupJournalTTS() {
    // Wait a bit for accessibility module to be fully loaded
    setTimeout(() => {
        // Import accessibility functions if available
        if (typeof window.setupTTS === 'function') {
            // If accessibility module is loaded, use its setupTTS function
            window.setupTTS();
        } else {
            // Fallback: setup basic TTS for journal elements
            document.querySelectorAll('.journal-title[data-tts], .journal-excerpt[data-tts]').forEach(el => {
                // Remove existing handlers
                el.onmouseenter = null;
                el.onmouseleave = null;

                // Add TTS handlers
                el.onmouseenter = function() {
                    const text = this.getAttribute('data-tts') || this.textContent.trim();
                    if (text && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'en'; // Default to English
                        utterance.rate = 1.2;
                        utterance.pitch = 1;
                        utterance.volume = 1;
                        window.speechSynthesis.speak(utterance);
                    }
                };
                el.onmouseleave = function() {
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                };

                // Add visual indicator
                el.classList.add('tts-enabled');
            });
        }
    }, 0);
}

/**
 * Refresh journal TTS when accessibility settings change
 * This should be called when TTS settings are toggled
 */
function refreshJournalTTS() {
    // Remove existing TTS handlers from journal elements
    document.querySelectorAll('.journal-title[data-tts], .journal-excerpt[data-tts]').forEach(el => {
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.classList.remove('tts-enabled');
    });

    // Re-setup TTS if enabled
    if (window.accessibilityState && window.accessibilityState.ttsEnabled) {
        setupJournalTTS();
    }
}

// Make refreshJournalTTS available globally
window.refreshJournalTTS = refreshJournalTTS;

/**
 * Update modal translations when language changes
 */
function updateModalTranslations() {
    // Import translations from accessibility module
    import('./accessibility.js').then(({ translations }) => {
        const currentLang = window.accessibilityState?.currentLanguage || 'en';
        const langTranslations = translations[currentLang] || translations['en'];

        // Update modal title if it's open
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            if (modalTitle.textContent.includes('Create') || modalTitle.textContent.includes('Create New Journal')) {
                modalTitle.textContent = langTranslations['Create New Journal'] || 'Create New Journal';
            } else if (modalTitle.textContent.includes('Edit') || modalTitle.textContent.includes('Edit Journal')) {
                modalTitle.textContent = langTranslations['Edit Journal'] || 'Edit Journal';
            }
        }

        // Update form labels
        const titleLabel = document.querySelector('label[for="journalTitle"]');
        if (titleLabel) titleLabel.textContent = langTranslations['Title'] || 'Title';

        const contentLabel = document.querySelector('label[for="journalContent"]');
        if (contentLabel) contentLabel.textContent = langTranslations['Content'] || 'Content';

        const tagsLabel = document.querySelector('label[for="journalTags"]');
        if (tagsLabel) tagsLabel.textContent = langTranslations['Tags'] || 'Tags';

        // Update buttons
        const cancelBtn = document.querySelector('.btn-cancel');
        if (cancelBtn) cancelBtn.textContent = langTranslations['Cancel'] || 'Cancel';

        const publishBtn = document.getElementById('journalSubmitBtn');
        if (publishBtn && !publishBtn.disabled) {
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + (langTranslations['Publish'] || 'Publish') + '</span>';
        }

        // Update placeholders
        const titleInput = document.getElementById('journalTitle');
        if (titleInput) titleInput.placeholder = langTranslations['Enter your journal title...'] || 'Enter your journal title...';

        const contentTextarea = document.getElementById('journalContent');
        if (contentTextarea) contentTextarea.placeholder = langTranslations['Write your thoughts here...'] || 'Write your thoughts here...';

        const tagsInput = document.getElementById('journalTags');
        if (tagsInput) tagsInput.placeholder = langTranslations['Enter tags separated by commas (e.g., life, thoughts, coding)'] || 'Enter tags separated by commas (e.g., life, thoughts, coding)';

        // Update small text
        const smallText = document.querySelector('.form-text');
        if (smallText) smallText.textContent = langTranslations['Separate tags with commas'] || 'Separate tags with commas';
    }).catch(error => {
        console.error('Error loading translations for modal:', error);
    });
}

export {
    loadUserJournals,
    loadAllJournals,
    displayJournals
};

