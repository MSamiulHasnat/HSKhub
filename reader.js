// Reader Logic for HSKHub

// --- Theme Management (Reused) ---
function initTheme() {
    const savedColor = localStorage.getItem('hsk-color') || 'red';
    const savedMode = localStorage.getItem('hsk-mode') || 'system';
    setColor(savedColor);
    setMode(savedMode);

    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => setColor(btn.getAttribute('data-color')));
    });

    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.getAttribute('data-mode')));
    });
}

function setColor(color) {
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('hsk-color', color);
    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === color);
    });
    // Update header color immediately if needed, handled by CSS variables
}

function setMode(mode) {
    let appliedMode = mode;
    if (mode === 'system') {
        const wantsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        appliedMode = wantsDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', appliedMode); // Matches CSS selector [data-theme="dark"]
    document.documentElement.setAttribute('data-mode', appliedMode); // Matches other selectors if any

    // Button states
    document.querySelectorAll('[data-mode]').forEach(btn => {
        const btnMode = btn.getAttribute('data-mode');
        btn.classList.toggle('active', btnMode === mode);
    });
    localStorage.setItem('hsk-mode', mode);
}

// --- Reader Logic ---

let bookData = null;
let currentChapterId = null;
let showPinyin = false;
let showMeaning = false;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadBookData();
    setupControls();
    updateVisibilityClasses(); // Apply initial interaction state
});

async function loadBookData() {
    try {
        const response = await fetch('data/hsk4book.json');
        if (!response.ok) throw new Error('Failed to load book data');
        
        const data = await response.json();
        bookData = data;
        
        // Update Title
        document.getElementById('book-title').innerText = `${data.info.level} Reader`;
        
        renderSidebar();
        
        // Load first chapter by default
        const firstChapterId = Object.keys(data.chapters)[0];
        if (firstChapterId) {
            loadChapter(firstChapterId);
        }

    } catch (error) {
        console.error(error);
        document.getElementById('chapter-list').innerHTML = `<li style="color:red; padding:20px;">Error loading book content.</li>`;
    }
}

function renderSidebar() {
    const list = document.getElementById('chapter-list');
    list.innerHTML = '';
    
    // Convert object to array and sort if needed (keys are "1", "2" etc)
    const chapterIds = Object.keys(bookData.chapters).sort((a,b) => parseInt(a) - parseInt(b));
    
    chapterIds.forEach(id => {
        const chapter = bookData.chapters[id];
        const li = document.createElement('li');
        li.className = 'chapter-item';
        li.dataset.id = id;
        li.innerHTML = `<strong>${id}.</strong> ${chapter.title} <br><small>${chapter.title_meaning || ''}</small>`;
        
        li.addEventListener('click', () => loadChapter(id));
        list.appendChild(li);
    });
}

function loadChapter(id) {
    stopAudio(); // Ensure previous audio stops when switching chapters
    currentChapterId = id;
    
    // Update sidebar active state
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });

    const chapter = bookData.chapters[id];
    const container = document.getElementById('text-display');
    container.innerHTML = ''; // Clear

    // Title Block
    const titleBlock = document.createElement('div');
    titleBlock.style.textAlign = 'center';
    titleBlock.style.marginBottom = '3rem';
    titleBlock.innerHTML = `
        <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--theme-primary);">${chapter.title}</h2>
        <div style="font-size: 1.2rem; color: var(--text-light);">${chapter.title_pinyin}</div>
        <div style="font-style: italic; color: var(--text-dark); margin-top: 0.5rem;">${chapter.title_meaning}</div>
    `;
    container.appendChild(titleBlock);

    // Sections
    chapter.sections.forEach((section, index) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'text-section';
        
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.style.display = 'flex';
        sectionTitle.style.alignItems = 'center';
        
        // Title Text
        const titleSpan = document.createElement('span');
        titleSpan.innerText = section.title || `Text ${index + 1}`;
        sectionTitle.appendChild(titleSpan);

        // Audio Button
        const audioBtn = document.createElement('button');
        audioBtn.className = 'audio-btn';
        audioBtn.innerHTML = '🔊';
        audioBtn.title = 'Read Aloud';
        sectionTitle.appendChild(audioBtn);

        sectionDiv.appendChild(sectionTitle);

        // Cards collection for audio mapping
        const cardMap = [];

        section.words.forEach(sentence => {
            const card = createSentenceCard(sentence);
            sectionDiv.appendChild(card);
            
            // Extract Speaker and Content for Audio Context
            let speaker = null;
            let content = sentence.hanzi;
            
            // Regex matches "Name：" or "Name:" at start
            const speakerMatch = sentence.hanzi.match(/^([^：:]+)[：:](.*)/);
            if (speakerMatch) {
                speaker = speakerMatch[1].trim();
                content = speakerMatch[2].trim();
            }

            // Prepare text for speech 
            cardMap.push({
                element: card,
                text: sentence.hanzi, // Key for backup
                content: content,      // Spoken text (minus name)
                speaker: speaker       // Detected speaker
            });
        });

        // Bind Click Action
        audioBtn.onclick = () => toggleSectionAudio(cardMap, audioBtn);

        container.appendChild(sectionDiv);
    });
    
    // Reset page scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Audio Logic ---
let currentUtterances = []; // Keep track to cancel if needed
let currentPlayingBtn = null;
let allVoices = [];

// Initialize voices
function initVoices() {
    const load = () => {
        allVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
        console.log("Loaded Chinese Voices:", allVoices.map(v => v.name));
    };

    window.speechSynthesis.onvoiceschanged = load;
    load(); // Try immediately as well
}

// Call init
initVoices();

function toggleSectionAudio(items, btn) {
    // 1. If this button is already playing, STOP.
    if (btn === currentPlayingBtn) {
        stopAudio();
        return;
    }

    // 2. If another button is playing, STOP it first.
    stopAudio();

    // 3. Start New Audio
    currentPlayingBtn = btn;
    btn.classList.add('playing');
    btn.innerHTML = '⏹'; // Stop icon

    // 4. Assign Voices to Speakers
    // Find unique speakers
    const speakers = [...new Set(items.map(i => i.speaker).filter(s => s))];
    const speakerVoiceMap = {};

    // Strategy: First speaker gets Voice A, Second gets Voice B.
    // Heuristic: Try to find a male-sounding vs female-sounding voice if possible
    // Common identifiers in voice names: "Female", "Male", "Huihui" (F), "Yaoyao" (F), "Kangkang" (M), "Hanhan" (F?)
    
    let voiceA = allVoices[0]; // Default
    let voiceB = allVoices.length > 1 ? allVoices[1] : voiceA;

    // Advanced selection if we have choices
    const femaleKeywords = ['female', 'woman', 'girl', 'huihui', 'yaoyao', 'lili'];
    const maleKeywords = ['male', 'man', 'boy', 'kangkang', 'danny', 'qiang'];

    const findVoice = (keywords, exclude) => allVoices.find(v => {
        const name = v.name.toLowerCase();
        return keywords.some(k => name.includes(k)) && v !== exclude;
    });

    const femaleVoice = findVoice(femaleKeywords, null);
    const maleVoice = findVoice(maleKeywords, femaleVoice);

    if (femaleVoice && maleVoice) {
        voiceA = femaleVoice;
        voiceB = maleVoice;
    } else if (femaleVoice && !maleVoice) {
         voiceA = femaleVoice;
         // Try to find any other for B
         const other = allVoices.find(v => v !== femaleVoice);
         if (other) voiceB = other;
    } else if (!femaleVoice && maleVoice) {
         voiceB = maleVoice;
         // Try to find any other for A
         const other = allVoices.find(v => v !== maleVoice);
         if (other) voiceA = other;
    }

    // Hardcode known HSK genders if possible for better experience?
    // Let's stick to simple alternation for now: 1st detected speaker = Voice A, 2nd = Voice B.
    if (speakers.length > 0) {
        speakerVoiceMap[speakers[0]] = voiceA;
    }
    if (speakers.length > 1) {
        speakerVoiceMap[speakers[1]] = voiceB;
    }
    // Any others rotate or stick to A
    for(let i=2; i<speakers.length; i++) {
        speakerVoiceMap[speakers[i]] = (i % 2 === 0) ? voiceA : voiceB;
    }
    
    // Setup Sequence
    items.forEach((item, i) => {
        // Use parsed content if speaker exists, otherwise full text
        const textToRead = item.speaker ? item.content : item.text;
        const u = new SpeechSynthesisUtterance(textToRead);
        u.lang = 'zh-CN';
        u.rate = 0.9; // Slightly slower for clarity
        
        // Apply Voice
        if (item.speaker && speakerVoiceMap[item.speaker]) {
            u.voice = speakerVoiceMap[item.speaker];
            // Optional: Pitch adjust? Women often higher, Men lower.
            // But real TTS voices handle this natively.
        } else if (!item.speaker) {
            // Narrator / No Speaker line -> Voice A
             u.voice = voiceA;
        } else {
             u.voice = voiceA;
        }

        u.onstart = () => {
            // Highlight current card
            item.element.classList.add('highlight-playing');
            // Auto-scroll logic 
            item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        
        u.onend = () => {
            item.element.classList.remove('highlight-playing');
            
            // If this was the last one, reset button
            if (i === items.length - 1) {
                stopAudio();
            }
        };

        u.onerror = (e) => {
            console.error("Speech Error", e);
            item.element.classList.remove('highlight-playing');
        };

        currentUtterances.push(u);
        window.speechSynthesis.speak(u);
    });
}

function stopAudio() {
    // Cancel all browser speech
    window.speechSynthesis.cancel();
    
    // Clear our trackers
    currentUtterances = [];
    
    // Reset UI
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('playing');
        currentPlayingBtn.innerHTML = '🔊';
        currentPlayingBtn = null;
    }

    // Clear all highlights
    document.querySelectorAll('.highlight-playing').forEach(el => {
        el.classList.remove('highlight-playing');
    });
}

// Stop audio if leaving page/chapter
const originalLoadChapter = loadChapter; // Store reference if needed (recursion issue here if I redefine loadChapter inside itself? No, I'm just editing the function body above)
// Better: Add stopAudio() to the beginning of loadChapter or window unload


function createSentenceCard(data) {
    const card = document.createElement('div');
    card.className = 'sentence-card';
    card.classList.toggle('has-visible-content', showPinyin || showMeaning); // Initial state
    
    // Detect Speaker (e.g., "Sun Yue: ...")
    // Regex looks for "Name:" or "Name：" at the start
    let hanziHtml = data.hanzi;
    const speakerRegex = /^([^：:]+[：:])(.*)/;
    const match = data.hanzi.match(speakerRegex);
    
    if (match) {
        hanziHtml = `<span class="speaker-name">${match[1]}</span>${match[2]}`;
    }

    card.innerHTML = `
        <div class="hanzi-line">${hanziHtml}</div>
        <div class="meta-data">
            <div class="pinyin-line">${data.pinyin}</div>
            <div class="meaning-line">${data.meaning}</div>
        </div>
    `;

    // Click to toggle specifically for this card
    card.addEventListener('click', () => {
        const isRevealed = card.classList.contains('revealed');
        if (isRevealed) {
            card.classList.remove('revealed');
            card.classList.remove('active-card');
            // If globals are off, we need to hide the meta-block border too
            if (!showPinyin && !showMeaning) {
                card.classList.remove('has-visible-content');
            }
        } else {
            card.classList.add('revealed');
            card.classList.add('active-card');
            card.classList.add('has-visible-content');
        }
    });

    return card;
}

function setupControls() {
    const btnPinyin = document.getElementById('btn-toggle-pinyin');
    const btnMeaning = document.getElementById('btn-toggle-meaning');
    
    // Pinyin Toggle
    btnPinyin.addEventListener('click', () => {
        showPinyin = !showPinyin;
        updateVisibilityClasses();
    });

    // Meaning Toggle
    btnMeaning.addEventListener('click', () => {
        showMeaning = !showMeaning;
        updateVisibilityClasses();
    });
}

function updateVisibilityClasses() {
    // 1. Update Buttons
    const btnPinyin = document.getElementById('btn-toggle-pinyin');
    const btnMeaning = document.getElementById('btn-toggle-meaning');
    
    if(btnPinyin) btnPinyin.classList.toggle('active', showPinyin);
    if(btnMeaning) btnMeaning.classList.toggle('active', showMeaning);

    // 2. Update Body Classes (Global CSS Control)
    const content = document.querySelector('.reader-content'); 
    // We attach classes to a parent container so CSS rules apply
    if (content) {
        content.classList.toggle('show-pinyin-mode', showPinyin);
        content.classList.toggle('show-meaning-mode', showMeaning);
    }

    // 3. Update 'has-visible-content' on all cards if needed so borders appear/disappear
    // If either global flag is true, ALL cards have visible content potentially
    // If both false, only 'revealed' cards have visible content
    const anyGlobalShow = showPinyin || showMeaning;
    document.querySelectorAll('.sentence-card').forEach(card => {
        if (anyGlobalShow || card.classList.contains('revealed')) {
            card.classList.add('has-visible-content');
        } else {
            card.classList.remove('has-visible-content');
        }
    });
}
