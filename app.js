// Main application logic for HSKHub

// --- Configuration ---
// TO USER: Create a Google Form with a text field for "Issue Details".
// Get the "pre-filled link" to find the entry ID (e.g., entry.123456789).
// Replace the URL below. Use 'CONTEXT_PLACEHOLDER' where the text should go.
// Example: "https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.123456=CONTEXT_PLACEHOLDER"
// For now, we fallback to a GitHub Issue search/new URL which is open-source standard.
const REPORT_URL_TEMPLATE = "https://github.com/MSamiulHasnat/HSKhub/issues/new?title=Data+Error&body=CONTEXT_PLACEHOLDER";

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

// Initialize Column Toggles
function initColumnToggles() {
    document.querySelectorAll('.toggle-header').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            const table = document.getElementById('vocab-table');
            const icon = th.querySelector('.toggle-icon');
            
            // Toggle class on table
            table.classList.toggle(`hide-${col}`);
            
            // Update Icon
            if (table.classList.contains(`hide-${col}`)) {
                th.style.opacity = '0.7';
                icon.textContent = '🔒'; // Or closed eye
            } else {
                th.style.opacity = '1';
                icon.textContent = '👁️';
            }
        });
        
        // Add cursor pointer style
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        
        // Add hover effect via JS or assume CSS handles it
        th.onmouseover = () => th.style.backgroundColor = 'var(--theme-bg-alpha)';
        th.onmouseout = () => th.style.backgroundColor = '';
    });
}

// 1. Detect which page we are on and get query parameters
const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get('level');

// 2. If we have a level parameter, we are on the level.html page
if (level) {
    console.log(`Loading data for HSK Level ${level}...`);
    initColumnToggles(); // Initialize the column toggles
    initLevelPage(level);
}

function initLevelPage(level) {
    // Update the header text
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }

    // Inject specific controls for HSK 4
    if (level === '4') {
        const heroContainer = document.querySelector('.hero .container');
        if (heroContainer) {
            // --- 1. Wordlist Source Switcher ---
            
            // Container
            const switchContainer = document.createElement('div');
            switchContainer.style.marginTop = '1rem';
            switchContainer.style.display = 'flex';
            switchContainer.style.justifyContent = 'center';
            switchContainer.style.gap = '10px';
            switchContainer.style.marginBottom = '1rem';
            
            // CSS for switcher
            const style = document.createElement('style');
            style.textContent = `
                .source-btn {
                    background: rgba(255,255,255,0.25);
                    border: 1px solid rgba(255,255,255,0.5);
                    color: var(--white);
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .source-btn:hover {
                    background: rgba(255,255,255,0.4);
                }
                .source-btn.active {
                    background: var(--white);
                    color: var(--theme-primary);
                    font-weight: 700;
                    border-color: var(--white);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(style);

            // Buttons
            const btnStandard = document.createElement('button');
            btnStandard.textContent = 'Standard Course';
            btnStandard.className = 'source-btn active';
            
            const btnSupertest = document.createElement('button');
            btnSupertest.textContent = 'SuperTest Version';
            btnSupertest.className = 'source-btn';

            // Interaction
            btnStandard.onclick = () => {
                if(btnStandard.classList.contains('active')) return;
                btnStandard.classList.add('active');
                btnSupertest.classList.remove('active');
                fetchVocabulary(level, ''); // Load standard
            };

            btnSupertest.onclick = () => {
                if(btnSupertest.classList.contains('active')) return;
                btnSupertest.classList.add('active');
                btnStandard.classList.remove('active');
                fetchVocabulary(level, 'Supertest'); // Load Supertest
            };

            switchContainer.appendChild(btnStandard);
            switchContainer.appendChild(btnSupertest);
            heroContainer.appendChild(switchContainer);

            // --- 1.b Expand/Collapse All ---
            const toggleAllBtn = document.createElement('button');
            toggleAllBtn.textContent = 'Expand All';
            toggleAllBtn.style.display = 'block';
            toggleAllBtn.style.margin = '0 auto 1rem auto';
            toggleAllBtn.style.padding = '5px 10px';
            toggleAllBtn.style.fontSize = '0.8rem';
            toggleAllBtn.style.cursor = 'pointer';
            toggleAllBtn.style.background = 'transparent';
            toggleAllBtn.style.border = '1px solid var(--white)';
            toggleAllBtn.style.color = 'var(--white)';
            toggleAllBtn.style.borderRadius = '15px';

            toggleAllBtn.onclick = () => {
                const headers = document.querySelectorAll('.chapter-header');
                const isExpand = toggleAllBtn.textContent.includes('Expand');
                
                headers.forEach(header => {
                    // Simulate click if needed or force open
                    // We need to find the specific rows
                    // But simpler: just inspect state.
                    const isOpen = header.querySelector('.toggle-icon').style.transform === 'rotate(90deg)';
                    
                    if (isExpand && !isOpen) {
                        header.click();
                    } else if (!isExpand && isOpen) {
                        header.click();
                    }
                });
                
                toggleAllBtn.textContent = isExpand ? 'Collapse All' : 'Expand All';
            };

            heroContainer.appendChild(toggleAllBtn);


            // --- 2. Read Book Button ---
            const btnLink = document.createElement('a');
            btnLink.href = 'book.html';
            btnLink.className = 'book-btn';
            btnLink.style.display = 'inline-block';
            btnLink.style.marginTop = '0.5rem';
            btnLink.style.backgroundColor = 'var(--white)';
            btnLink.style.color = 'var(--theme-primary)';
            btnLink.style.padding = '0.75rem 1.5rem';
            btnLink.style.borderRadius = '30px';
            btnLink.style.textDecoration = 'none';
            btnLink.style.fontWeight = 'bold';
            btnLink.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            btnLink.innerHTML = '📖 Read HSK 4 Standard Course';
            
            btnLink.onmouseover = () => {
                btnLink.style.transform = 'translateY(-2px)';
                btnLink.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            };
            btnLink.onmouseout = () => {
                btnLink.style.transform = 'translateY(0)';
                btnLink.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            };
            btnLink.style.transition = 'all 0.3s ease';

            heroContainer.appendChild(btnLink);
        }
    }

    // Call the fetch function
    fetchVocabulary(level);
}

// 3. The Fetch Logic
async function fetchVocabulary(level, variant = '') {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.style.display = 'none';

    // Handle variant properly (ensure "Supertest" matches file if needed)
    // If variant is 'Supertest', file is 'hsk4Supertest.json'
    const filePath = `data/hsk${level}${variant}.json`;
    console.log(`Fetching: ${filePath}`);

    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Could not find data for HSK ${level} (${variant || 'Standard'}). Status: ${response.status}`);
        }

        const rawData = await response.json();
        const normalizedData = normalizeData(rawData);
        
        console.log(`Normalized Data: ${normalizedData.length} groups found.`);

        if (normalizedData.length === 0) {
            throw new Error(`No vocabulary words found in file (Parsed 0 groups).`);
        }

        renderTable(normalizedData);

    } catch (error) {
        console.error('Fetch error:', error);
        if (errorMsg) {
             errorMsg.innerHTML = `<strong>Error loading data:</strong> ${error.message}<br><small>Check console for details.</small>`;
             errorMsg.style.display = 'block';
             errorMsg.style.padding = '20px';
             errorMsg.style.background = 'rgba(255, 0, 0, 0.1)';
             errorMsg.style.borderRadius = '8px';
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
        
        // Use reduce instead of flatMap for maximum compatibility
        return sortedKeys.reduce((acc, key) => {
            const unit = data.units[key];
            
            // Case B: Words are nested in lessons (Supertest structure)
            if (unit.lessons) {
                const lessonKeys = Object.keys(unit.lessons).sort((a, b) => parseInt(a) - parseInt(b));
                const lessonGroups = lessonKeys.map(lKey => {
                    const lesson = unit.lessons[lKey];
                    // Construct a title like "Unit 1 - Lesson 1"
                    const groupTitle = `${unit.title || 'Unit ' + key} - ${lesson.title || 'Lesson ' + lKey}`;
                    
                    return {
                        title: groupTitle,
                        words: lesson.words || []
                    };
                });
                return acc.concat(lessonGroups);
            }
            
            // Case A: Words are directly in the unit (Fallback)
            return acc.concat([{
                title: unit.title || `Chapter ${key}`,
                words: unit.words || []
            }]);
        }, []);
    }

    return [];
}

// Helper: Open Report Window
function openReport(context) {
    const safeContext = encodeURIComponent(`Reported Issue:\n\n${context}\n\n[Please describe the error here]`);
    const url = REPORT_URL_TEMPLATE.replace('CONTEXT_PLACEHOLDER', safeContext);
    window.open(url, '_blank');
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

            // Report Button
            // We'll attach the listener after creating the element to handle quotes safely
            const reportBtnHtml = `<button class="report-btn" title="Report mistake">⚑</button>`;

            row.innerHTML = `
                <td class="col-index" style="color: var(--text-light); font-size: 0.9em;">
                    ${serialNumber++}
                    ${reportBtnHtml}
                </td>
                <td class="col-hanzi"><span class="hanzi-main">${word.hanzi}</span></td>
                <td class="col-pinyin">${word.pinyin}</td>
                <td class="col-meaning">${word.meaning}</td>
                <td class="col-type">${partOfSpeech}</td>
                <td class="col-sentence">${sentenceHtml}</td>
            `;
            
            // Attach event listener
            const btn = row.querySelector('.report-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop row click (accordion)
                    
                    // Add Level and Chapter context
                    const location = group.title ? `HSK ${level} - ${group.title}` : `HSK ${level}`;
                    openReport(`${location}\nWord: ${word.hanzi} (${word.pinyin})`);
                });
            }

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
