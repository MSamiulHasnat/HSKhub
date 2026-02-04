// Main application logic for HSKHub

// Theme Handling
function initTheme() {
    // 1. Get saved preferences or use defaults
    const savedColor = localStorage.getItem('hsk-color') || 'red';
    const savedMode = localStorage.getItem('hsk-mode') || 'system';

    // 2. Apply them
    setColor(savedColor);
    setMode(savedMode);

    // 3. Add Event Listeners
    
    // Color Buttons
    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-color');
            setColor(color);
        });
    });

    // Mode Buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            setMode(mode);
        });
    });
}

function setColor(color) {
    // Update DOM
    document.documentElement.setAttribute('data-color', color);
    // Save
    localStorage.setItem('hsk-color', color);
    
    // Update UI Active State
    document.querySelectorAll('[data-color]').forEach(btn => {
        if (btn.getAttribute('data-color') === color) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setMode(mode) {
    // Check if system default is requested
    let appliedMode = mode;
    
    if (mode === 'system') {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        appliedMode = prefersDark ? 'dark' : 'light';
    }

    // Update DOM (we set the actual visual mode: light/dark)
    document.documentElement.setAttribute('data-mode', appliedMode);
    
    // Save the abstract preference (light/dark/system)
    localStorage.setItem('hsk-mode', mode);

    // Update UI Active State (based on preference, not underlying result)
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Listen for system changes if in 'system' mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('hsk-mode') === 'system') {
        const newMode = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-mode', newMode);
    }
});

// Initialize theme immediately
initTheme();

// 1. Detect which page we are on and get query parameters
const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get('level');

// 2. If we have a level parameter, we are on the level.html page
if (level) {
    console.log(`Loading data for HSK Level ${level}...`);
    initLevelPage(level);
}

function initLevelPage(level) {
    // Update the header text
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }

    // Inject "Read Book" button for HSK 4
    if (level === '4') {
        const heroContainer = document.querySelector('.hero .container');
        if (heroContainer) {
            const btnLink = document.createElement('a');
            btnLink.href = 'book.html';
            btnLink.className = 'book-btn';
            btnLink.style.display = 'inline-block';
            btnLink.style.marginTop = '1rem';
            btnLink.style.backgroundColor = 'var(--white)';
            btnLink.style.color = 'var(--theme-primary)';
            btnLink.style.padding = '0.75rem 1.5rem';
            btnLink.style.borderRadius = '30px';
            btnLink.style.textDecoration = 'none';
            btnLink.style.fontWeight = 'bold';
            btnLink.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            btnLink.innerHTML = '📖 Read HSK 4 Standard Course';
            
            // Hover effect logic handled via inline JS or CSS, but cleaner to just simple styles
            btnLink.onmouseover = () => {
                btnLink.style.transform = 'translateY(-2px)';
                btnLink.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            };
            btnLink.onmouseout = () => {
                btnLink.style.transform = 'translateY(0)';
                btnLink.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            };

            // Transition
            btnLink.style.transition = 'all 0.3s ease';

            heroContainer.appendChild(btnLink);
        }
    }

    // Call the fetch function
    fetchVocabulary(level);
}

// 3. The Fetch Logic
async function fetchVocabulary(level) {
    const filePath = `data/hsk${level}.json`;

    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Could not find data for HSK ${level}`);
        }

        const rawData = await response.json();
        const normalizedData = normalizeData(rawData);
        
        if (normalizedData.length === 0) {
            throw new Error(`No vocabulary words found in file.`);
        }

        renderTable(normalizedData);

    } catch (error) {
        console.error('Fetch error:', error);
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
             errorMsg.textContent = `Error: ${error.message}`;
             errorMsg.style.display = 'block';
        }
    }
}

// Helper: Handle different JSON structures
function normalizeData(data) {
    // 1. Top-level Array (HSK 1-3 simple structure) -> Single Group
    if (Array.isArray(data)) {
        return [{ title: null, words: data }];
    }
    
    // 2. Nested Chapters -> Sections -> Words (New HSK 4 structure)
    if (data.chapters) {
        // Sort keys to ensure Chapter 1 comes before Chapter 2
        const sortedKeys = Object.keys(data.chapters).sort((a, b) => parseInt(a) - parseInt(b));
        
        return sortedKeys.map(key => {
            const chapter = data.chapters[key];
            let chapterWords = [];
            
            // Aggregate words from all sections in this chapter
            if (chapter.sections && Array.isArray(chapter.sections)) {
                chapter.sections.forEach(section => {
                     if (section.words && Array.isArray(section.words)) {
                         chapterWords = chapterWords.concat(section.words);
                     }
                });
            }

            return {
                title: `Chapter ${key}: ${chapter.title} ${chapter.title_meaning ? '- ' + chapter.title_meaning : ''}`,
                words: chapterWords
            };
        });
    }

    // 3. Nested Units Object (Old/Alternative HSK 4 structure)
    if (data.units) {
        const sortedKeys = Object.keys(data.units).sort((a, b) => parseInt(a) - parseInt(b));
        return sortedKeys.map(key => {
            const unit = data.units[key];
            return {
                title: unit.title || `Chapter ${key}`,
                words: unit.words || []
            };
        });
    }

    return [];
}

// 4. Dynamic HTML Injection
function renderTable(groups) {
    const tbody = document.getElementById('vocab-body');
    if (!tbody) return;
    
    tbody.innerHTML = ''; // Clear any existing content

    let serialNumber = 1; // Global counter across all chapters

    groups.forEach((group, index) => {
        const groupId = `chapter-group-${index}`;
        
        // Only render headers if we have a title (HSK 4)
        if (group.title) {
            const headerRow = document.createElement('tr');
            headerRow.className = 'chapter-header';
            headerRow.style.cursor = 'pointer';
            
            // Add icon and title
            headerRow.innerHTML = `
                <td colspan="6">
                    <span class="toggle-icon" style="display:inline-block; transition: transform 0.2s; margin-right: 8px;">▶</span>
                    ${group.title}
                    <span style="float:right; font-size: 0.8em; opacity: 0.7;">${group.words.length} words</span>
                </td>
            `;

            // Click Handler
            headerRow.addEventListener('click', () => {
                const rows = document.querySelectorAll(`.${groupId}`);
                const icon = headerRow.querySelector('.toggle-icon');
                
                // Determine current state based on first row
                const isHidden = rows.length > 0 && rows[0].style.display === 'none';
                
                rows.forEach(row => {
                    row.style.display = isHidden ? 'table-row' : 'none';
                });

                // Animate Icon
                icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                
                // Optional: distinct style for open header
                if (isHidden) {
                    headerRow.classList.add('open');
                } else {
                    headerRow.classList.remove('open');
                }
            });

            tbody.appendChild(headerRow);
        }

        group.words.forEach(word => {
            // Create a new row
            const row = document.createElement('tr');
            
            // If grouped, hide by default and assign class
            if (group.title) {
                row.className = groupId;
                row.style.display = 'none';
            }

            // Construct the HTML for the row
            // HSK 4 uses 'pos' instead of 'type', handle both
            const partOfSpeech = word.type || word.pos || '';

            // Handle Sentence (if exists)
            let sentenceHtml = '';
            if (word.sentence) {
                sentenceHtml = `
                    <div class="sentence-block">
                        <div class="cn">${word.sentence}</div>
                        <div class="py">${word.sentence_pinyin || ''}</div>
                        <div class="en">${word.sentence_meaning || ''}</div>
                    </div>
                `;
            }

            row.innerHTML = `
                <td style="color: var(--text-light); font-size: 0.9em;">${serialNumber++}</td>
                <td><span class="hanzi-main">${word.hanzi}</span></td>
                <td>${word.pinyin}</td>
                <td>${word.meaning}</td>
                <td>${partOfSpeech}</td>
                <td>${sentenceHtml}</td>
            `;

            // Append to the table body
            tbody.appendChild(row);
        });

        // Add Chapter Footer (Scroll to Top of Chapter)
        if (group.title) {
            const footerRow = document.createElement('tr');
            footerRow.className = `chapter-footer ${groupId}`; // Assign class so it toggles with the rest
            footerRow.style.display = 'none'; // Hidden by default
            
            footerRow.innerHTML = `
                <td colspan="6">
                    <button class="chapter-top-btn">↑ Back to Chapter Top</button>
                </td>
            `;
            
            // Interaction
            footerRow.querySelector('button').addEventListener('click', (e) => {
                e.preventDefault(); // Prevent accidental form submit
                // Scroll the header row into view smoothly
                const header = document.querySelectorAll('.chapter-header')[index]; // Get corresponding header
                if (header) {
                    header.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            tbody.appendChild(footerRow);
        }
    });

    // Initialize Back to Top Logic
    initScrollToTop();
}


// Scroll to Webpage Top Logic
function initScrollToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    // Show/Hide button on scroll
    window.onscroll = function() {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    // Scroll action
    backToTopBtn.onclick = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}
