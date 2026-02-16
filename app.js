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
        
        // Hover effect is now handled in CSS to prevent sticky header transparency issues
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

    // --- Inject Progress Dashboard ---
    const heroContainer = document.querySelector('.hero .container');
    if (heroContainer) {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-dashboard';
        progressContainer.style.marginTop = '1.5rem';
        progressContainer.style.maxWidth = '600px';
        progressContainer.style.marginLeft = 'auto';
        progressContainer.style.marginRight = 'auto';
        progressContainer.style.textAlign = 'left';
        progressContainer.style.background = 'rgba(0,0,0,0.2)';
        progressContainer.style.padding = '15px';
        progressContainer.style.borderRadius = '10px';
        progressContainer.style.color = 'var(--white)';
        
        progressContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:bold; font-size:0.9rem;">
                <span>Memorization Progress</span>
                <span id="progress-text">Loading...</span>
            </div>
            <div style="height:10px; background:rgba(255,255,255,0.3); border-radius:5px; overflow:hidden;">
                <div id="progress-fill" style="height:100%; width:0%; background:#4caf50; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align:right; margin-top:5px;">
                <button id="reset-progress" style="background:none; border:none; color:rgba(255,255,255,0.7); font-size:0.75rem; text-decoration:underline; cursor:pointer;">Reset Progress</button>
            </div>
        `;

        heroContainer.appendChild(progressContainer);
        
        // Reset Logic
        document.getElementById('reset-progress').addEventListener('click', () => {
             if(confirm('Are you sure you want to clear your progress for this level?')) {
                 saveLearnedWords(level, []);
                 // Re-render to update checkboxes
                 // We can trigger a re-fetch or just update DOM directly. 
                 // Re-fetch is safer to sync everything.
                 const currentVariantButton = document.querySelector('.source-btn.active');
                 const variant = (currentVariantButton && currentVariantButton.textContent.includes('SuperTest')) ? 'Supertest' : '';
                 fetchVocabulary(level, variant);
             }
        });
    }

    // Call the fetch function
    fetchVocabulary(level);
}

// --- Storage Helpers ---
function getLearnedWords(level) {
    const key = `hsk-learned-${level}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function saveLearnedWords(level, list) {
    const key = `hsk-learned-${level}`;
    localStorage.setItem(key, JSON.stringify(list));
    // Note: Update UI calculation happens where we have access to total count (renderTable scope)
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
        
        return sortedKeys.map(key => {
            const unit = data.units[key];
            const title = unit.title || `Unit ${key}`;
            
            // Nested Lessons
            if (unit.lessons) {
                const lessonKeys = Object.keys(unit.lessons).sort((a, b) => parseInt(a) - parseInt(b));
                const lessonGroups = lessonKeys.map(lKey => {
                    const lesson = unit.lessons[lKey];
                    return {
                        title: lesson.title || `Lesson ${lKey}`,
                        words: lesson.words || []
                    };
                });
                
                return {
                    title: title,
                    isParent: true, // Marker for hierarchical rendering
                    subGroups: lessonGroups,
                    words: [] // Parent has no words directly, but useful for counting if needed
                };
            }
            
            // Fallback for flat unit
            return {
                title: title,
                words: unit.words || []
            };
        });
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

    // --- Progress Calculation Setup ---
    let learnedWords = getLearnedWords(level); 
    
    // Calculate total words recursively
    const countWords = (grp) => {
        if (grp.isParent && grp.subGroups) {
            return grp.subGroups.reduce((sum, sub) => sum + countWords(sub), 0);
        }
        return (grp.words || []).length;
    };
    
    const totalWords = groups.reduce((acc, group) => acc + countWords(group), 0);
    updateProgressDisplay(learnedWords.length, totalWords);

    // Helpers for bulk toggling
    const updateLearnedList = (newWords, isAdding) => {
        if (isAdding) {
            learnedWords = [...new Set([...learnedWords, ...newWords])];
        } else {
            learnedWords = learnedWords.filter(w => !newWords.includes(w));
        }
        saveLearnedWords(level, learnedWords);
        updateProgressDisplay(learnedWords.length, totalWords);
        
        // Update Checked State in UI for all affected rows
        const checkboxes = document.querySelectorAll('.learned-checkbox');
        checkboxes.forEach(cb => {
            // Find word hanzi from row context (assuming stored in attribute or traversable)
            // Safer way: re-check the 'hanzi' span in the row
            const row = cb.closest('tr');
            const hanziSpan = row.querySelector('.hanzi-main');
            if (hanziSpan) {
                const hanzi = hanziSpan.textContent;
                if (newWords.includes(hanzi)) {
                    cb.checked = isAdding;
                    if (isAdding) row.classList.add('learned-row');
                    else row.classList.remove('learned-row');
                }
            }
        });

        // Update Unit/Lesson/Chapter Headers State
        updateHeaderStates();
    };

    let serialNumber = 1; // Global counter

    groups.forEach((group, groupIndex) => {
        // --- Case A: Nested Structure (SuperTest/Units) ---
        if (group.isParent) {
            const unitId = `unit-${groupIndex}`;
            
            // 1. Render Unit Header
            const unitRow = document.createElement('tr');
            unitRow.className = 'unit-header unit-header-row'; // Use new consolidated style class
            unitRow.style.cursor = 'pointer';
            // Background/Border handled by CSS now

            const unitWordCount = countWords(group);
            
            // Collect all words in this unit for "Check All"
            const getAllUnitWordHanzis = () => {
                let hanzis = [];
                if(group.subGroups) {
                    group.subGroups.forEach(sub => {
                        if(sub.words) hanzis.push(...sub.words.map(w => w.hanzi));
                    })
                }
                return hanzis;
            };

            // Check if all are already learned to set initial state
            const unitHanzis = getAllUnitWordHanzis();
            const isUnitFullyLearned = unitHanzis.length > 0 && unitHanzis.every(h => learnedWords.includes(h));
            
            if (isUnitFullyLearned) {
                unitRow.classList.add('learned-row');
            }

            unitRow.innerHTML = `
                <td style="padding: 15px; text-align: center; width: 40px;">
                    <input type="checkbox" class="unit-checkbox" title="Mark Unit as Learned" ${isUnitFullyLearned ? 'checked' : ''}>
                </td>
                <td colspan="6" style="padding: 15px; font-weight: bold; font-size: 1.2rem; color: var(--theme-primary-dark);">
                    <span class="toggle-icon" style="display:inline-block; transition: transform 0.2s; margin-right: 10px;">▶</span>
                    ${group.title}
                    <span style="float:right; font-size: 0.8rem; background: var(--bg-light); padding: 2px 8px; border-radius: 10px; color: var(--text-light); margin-top: 2px;">${unitWordCount} words</span>
                </td>
            `;
            tbody.appendChild(unitRow);

            // Unit Checkbox Event
            const unitCb = unitRow.querySelector('.unit-checkbox');
            unitCb.onclick = (e) => {
                e.stopPropagation(); // Stop toggle
                const isChecked = e.target.checked;
                updateLearnedList(unitHanzis, isChecked);
                
                // Add visual feedback to unit row immediately
                if(isChecked) unitRow.classList.add('learned-row');
                else unitRow.classList.remove('learned-row');
                
                // Also update all lesson checkboxes inside this unit
                const lessonCbs = document.querySelectorAll(`.lesson-checkbox-${unitId}`);
                lessonCbs.forEach(lcb => {
                    lcb.checked = isChecked;
                    // Update lesson row styles too
                    const lRow = lcb.closest('tr');
                    if(lRow) {
                        if(isChecked) lRow.classList.add('learned-row');
                        else lRow.classList.remove('learned-row');
                    }
                });
            };

            // Unit Toggle Logic
            unitRow.addEventListener('click', (e) => {
                // Ignore clicks on checkbox cell (though onclick stops propagation, be safe)
                if (e.target.type === 'checkbox') return;

                const subHeaders = document.querySelectorAll(`.lesson-header-${unitId}`);
                const icon = unitRow.querySelector('.toggle-icon');
                
                // Check state based on first subheader
                const isHidden = subHeaders.length > 0 && subHeaders[0].style.display === 'none';
                
                subHeaders.forEach(header => {
                    header.style.display = isHidden ? 'table-row' : 'none';
                    if (!isHidden) {
                        const lessonId = header.getAttribute('data-lesson-id');
                        const rows = document.querySelectorAll(`.${lessonId}`);
                        rows.forEach(r => r.style.display = 'none');
                        const lessonIcon = header.querySelector('.toggle-icon');
                        if(lessonIcon) lessonIcon.style.transform = 'rotate(0deg)';
                    }
                });

                icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
            });

            // 2. Render Lesson Sub-Groups
            if (group.subGroups) {
                group.subGroups.forEach((subGroup, subIndex) => {
                    const lessonId = `${unitId}-lesson-${subIndex}`;
                    
                    // Lesson Header
                    const lessonRow = document.createElement('tr');
                    lessonRow.className = `chapter-header lesson-header-${unitId} lesson-header-row`; // Added consolidated style class
                    lessonRow.setAttribute('data-lesson-id', lessonId);
                    lessonRow.style.cursor = 'pointer';
                    lessonRow.style.display = 'none'; // Hidden by default (Unit closed)
                    
                    const lessonHanzis = subGroup.words ? subGroup.words.map(w => w.hanzi) : [];
                    const isLessonFullyLearned = lessonHanzis.length > 0 && lessonHanzis.every(h => learnedWords.includes(h));

                    // Indented style for hierarchy
                    lessonRow.innerHTML = `
                         <td style="text-align: center; width: 40px; background: rgba(0,0,0,0.02);">
                             <input type="checkbox" class="lesson-checkbox-${unitId}" title="Mark Lesson as Learned" ${isLessonFullyLearned ? 'checked' : ''}>
                         </td>
                        <td colspan="6" class="lesson-header-cell">
                            <span class="toggle-icon" style="display:inline-block; transition: transform 0.2s; margin-right: 8px;">▶</span>
                            ${subGroup.title}
                            <span style="float:right; font-size: 0.8em; opacity: 0.7;">${subGroup.words.length} words</span>
                        </td>
                    `;
                    tbody.appendChild(lessonRow);
                    
                    // Lesson Checkbox Event
                    const lessonCb = lessonRow.querySelector('input[type="checkbox"]');
                    lessonCb.onclick = (e) => {
                        e.stopPropagation();
                        const isChecked = e.target.checked;
                        updateLearnedList(lessonHanzis, isChecked);
                        
                        // Update visual style
                        if(isChecked) lessonRow.classList.add('learned-row');
                        else lessonRow.classList.remove('learned-row');
                    };
                    
                    // Initial State Class
                    if(isLessonFullyLearned) {
                         lessonRow.classList.add('learned-row');
                    }

                    // Lesson Toggle Logic
                    lessonRow.addEventListener('click', (e) => {
                        if (e.target.type === 'checkbox') return;
                        e.stopPropagation(); // Don't trigger unit toggle
                        const rows = document.querySelectorAll(`.${lessonId}`);
                        const icon = lessonRow.querySelector('.toggle-icon');
                        const isHidden = rows.length > 0 && rows[0].style.display === 'none';
                        
                        rows.forEach(row => {
                            row.style.display = isHidden ? 'table-row' : 'none';
                        });
                        icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                    });

                    // Render Words
                    renderWords(subGroup.words, lessonId, tbody, learnedWords, totalWords);
                });
            }

        // --- Case B: Flat Structure (Standard HSK) ---
        } else {
            const groupId = `chapter-group-${groupIndex}`;
            const groupHanzis = group.words ? group.words.map(w => w.hanzi) : [];
            const isGroupFullyLearned = groupHanzis.length > 0 && groupHanzis.every(h => learnedWords.includes(h));

            // Header
            if (group.title) {
                const headerRow = document.createElement('tr');
                headerRow.className = 'chapter-header';
                headerRow.style.cursor = 'pointer';
                
                headerRow.innerHTML = `
                    <td style="text-align: center; width: 40px;">
                        <input type="checkbox" class="chapter-checkbox" title="Mark Chapter as Learned" ${isGroupFullyLearned ? 'checked' : ''}>
                    </td>
                    <td colspan="6">
                        <span class="toggle-icon" style="display:inline-block; transition: transform 0.2s; margin-right: 8px;">▶</span>
                        ${group.title}
                        <span style="float:right; font-size: 0.8em; opacity: 0.7;">${group.words ? group.words.length : 0} words</span>
                    </td>
                `;
                
                // Checkbox Event
                const chapterCb = headerRow.querySelector('.chapter-checkbox');
                chapterCb.onclick = (e) => {
                    e.stopPropagation();
                    updateLearnedList(groupHanzis, e.target.checked);
                };

                headerRow.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    const rows = document.querySelectorAll(`.${groupId}`);
                    const icon = headerRow.querySelector('.toggle-icon');
                    const isHidden = rows.length > 0 && rows[0].style.display === 'none';
                    
                    rows.forEach(row => {
                        row.style.display = isHidden ? 'table-row' : 'none';
                    });
                    icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                });

                tbody.appendChild(headerRow);
            }

            // Words
            renderWords(group.words, group.title ? groupId : '', tbody, learnedWords, totalWords);
            
            // Footer
             if (group.title) {
                renderFooter(groupId, groupIndex, tbody);
            }
        }
    });

    // Helper to render word rows
    // We pass learnedWords by reference? No, we need it to update the MAIN list.
    // Instead of passing a static array, let's use the getter or closure if defined inside.
    // Since this function is defined inside, let's use the outer scope 'learnedWords'.
    function renderWords(words, classId, container) {

        if (!words) return;
        
        words.forEach(word => {
            const row = document.createElement('tr');
            // Check against current state, not captured state
            const isLearned = learnedWords.includes(word.hanzi);

            // Classes
            if (isLearned) row.classList.add('learned-row');
            if (classId) {
                row.classList.add(classId);
                row.style.display = 'none'; // Default hidden for groups
            }

            // Content Construction
            const partOfSpeech = word.type || word.pos || '';
            let sentenceHtml = '';
            if (word.sentence) {
                sentenceHtml = `<div class="sentence-block"><div class="cn">${word.sentence}</div><div class="py">${word.sentence_pinyin || ''}</div><div class="en">${word.sentence_meaning || ''}</div></div>`;
            }
            const reportBtnHtml = `<button class="report-btn" title="Report mistake">⚑</button>`;
            
            // Checkbox: add data attribute for easy finding
            const checkboxHtml = `<input type="checkbox" class="learned-checkbox" ${isLearned ? 'checked' : ''} aria-label="Mark as learned" data-hanzi="${word.hanzi}">`;

            row.innerHTML = `
                <td style="text-align:center;">${checkboxHtml}</td>
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

            // Events
            const checkbox = row.querySelector('.learned-checkbox');
            checkbox.addEventListener('change', (e) => {
                const hanzi = word.hanzi;
                if (e.target.checked) {
                    if (!learnedWords.includes(hanzi)) {
                        learnedWords.push(hanzi);
                    }
                    row.classList.add('learned-row');
                } else {
                    const idx = learnedWords.indexOf(hanzi);
                    if (idx > -1) {
                        learnedWords.splice(idx, 1);
                    }
                    row.classList.remove('learned-row');
                }
                
                // Save & Update
                saveLearnedWords(level, learnedWords);
                updateProgressDisplay(learnedWords.length, totalWords);
                
                // Trigger the header check logic to uncheck bulk boxes if needed
                // We can extract that logic to a helper function since we need it in two places now
                updateHeaderStates(); 
            });
            
             const btn = row.querySelector('.report-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    openReport(`HSK ${level}\nWord: ${word.hanzi} (${word.pinyin})`);
                });
            }

            container.appendChild(row);
        });
        
        // Add footer for this specific lesson/group
        if (classId) {
             renderFooter(classId, -1, container); // index -1 because scroll logic differs or we skip
        }
    }

    // New Helper: Update Header States (Extracted from updateLearnedList)
    function updateHeaderStates() {
        // 1. Check Lessons (Sub-groups)
        document.querySelectorAll('.lesson-header-row').forEach(lessonRow => {
            const lessonId = lessonRow.getAttribute('data-lesson-id');
            if (!lessonId) return;
            
            const wordRows = document.querySelectorAll(`.${lessonId}`);
            if (wordRows.length === 0) return;

            let isFullyLearned = true;
            wordRows.forEach(r => {
                if (!r.classList.contains('learned-row')) isFullyLearned = false;
            });

            const cb = lessonRow.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = isFullyLearned;
            
            if (isFullyLearned) lessonRow.classList.add('learned-row');
            else lessonRow.classList.remove('learned-row');
        });

        // 2. Check Units (Parent groups)
        document.querySelectorAll('.unit-header').forEach(unitRow => {
            let allLessonsLearned = true;
            let foundLessons = false;
            let sibling = unitRow.nextElementSibling;
            
            while (sibling) {
                if (sibling.classList.contains('unit-header')) break; 
                
                if (sibling.classList.contains('lesson-header-row')) {
                    foundLessons = true;
                    if (!sibling.classList.contains('learned-row')) {
                        allLessonsLearned = false;
                    }
                }
                sibling = sibling.nextElementSibling;
            }
            
            if (foundLessons) {
                const cb = unitRow.querySelector('.unit-checkbox');
                if (cb) cb.checked = allLessonsLearned;
                
                if (allLessonsLearned) unitRow.classList.add('learned-row');
                else unitRow.classList.remove('learned-row');
            }
        });
        
        // 3. Check Chapters (Flat structure)
        document.querySelectorAll('.chapter-header:not(.lesson-header-row)').forEach(chapRow => {
             let allWordsLearned = true;
             let foundWords = false;
             let sibling = chapRow.nextElementSibling;

             while (sibling) {
                 if (sibling.classList.contains('chapter-header') || sibling.classList.contains('unit-header')) break;
                 
                 if (sibling.querySelector('.learned-checkbox')) {
                     foundWords = true;
                     if(!sibling.classList.contains('learned-row')) {
                         allWordsLearned = false;
                     }
                 }
                 sibling = sibling.nextElementSibling;
             }

             if (foundWords) {
                 const cb = chapRow.querySelector('.chapter-checkbox');
                 if (cb) cb.checked = allWordsLearned;
                 if (allWordsLearned) chapRow.classList.add('learned-row');
                 else chapRow.classList.remove('learned-row');
             }
        });
    }

    function renderFooter(groupId, headerIndex, container) {
        const footerRow = document.createElement('tr');
        footerRow.className = `chapter-footer ${groupId}`;
        footerRow.style.display = 'none';
        
        footerRow.innerHTML = `<td colspan="7"><button class="chapter-top-btn">↑ Back to Top</button></td>`;
        
        footerRow.querySelector('button').addEventListener('click', (e) => {
            e.preventDefault();
            // Find the visible header for this group
            // For nested, it's complex. Simple approach: find the first row of this group and scroll to it
            const firstRow = document.querySelector(`.${groupId}`);
            if (firstRow && firstRow.previousElementSibling) {
                 firstRow.previousElementSibling.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        container.appendChild(footerRow);
    }

    initScrollToTop();
}

function updateProgressDisplay(learnedCount, totalCount) {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressText && progressFill) {
        if (totalCount === 0) return;
        
        const percent = Math.round((learnedCount / totalCount) * 100);
        progressText.textContent = `${learnedCount} / ${totalCount} (${percent}%)`;
        progressFill.style.width = `${percent}%`;
        
        // Optional: Change color on complete
        if (percent === 100) {
            progressFill.style.backgroundColor = '#FFD700'; // Gold
        } else {
            progressFill.style.backgroundColor = '#4caf50';
        }
    }
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
