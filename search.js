// Universal Search Module for HSKHub
// Loaded on all pages to provide cross-level search by hanzi, pinyin, and meaning.

(function () {
    // Available data sources
    const DATA_SOURCES = [
        { level: 1, file: 'data/hsk1.json' },
        { level: 4, file: 'data/hsk4.json' }
    ];

    let wordIndex = []; // Flat list: { hanzi, pinyin, meaning, type, level }
    let indexReady = false;

    // --- Build Index ---

    function flattenData(rawData, level) {
        const words = [];

        // Flat array (HSK 1-3)
        if (Array.isArray(rawData)) {
            rawData.forEach(w => {
                words.push({
                    hanzi: w.hanzi,
                    pinyin: w.pinyin,
                    meaning: w.meaning,
                    type: w.type || w.pos || '',
                    level: level
                });
            });
            return words;
        }

        // Nested chapters (HSK 4)
        if (rawData.chapters) {
            const keys = Object.keys(rawData.chapters).sort((a, b) => parseInt(a) - parseInt(b));
            keys.forEach(key => {
                const chapter = rawData.chapters[key];
                if (chapter.sections) {
                    chapter.sections.forEach(section => {
                        if (section.words) {
                            section.words.forEach(w => {
                                words.push({
                                    hanzi: w.hanzi,
                                    pinyin: w.pinyin,
                                    meaning: w.meaning,
                                    type: w.type || w.pos || '',
                                    level: level
                                });
                            });
                        }
                    });
                }
            });
            return words;
        }

        // Nested units (alternative HSK 4)
        if (rawData.units) {
            const keys = Object.keys(rawData.units).sort((a, b) => parseInt(a) - parseInt(b));
            keys.forEach(key => {
                const unit = rawData.units[key];
                if (unit.lessons) {
                    Object.values(unit.lessons).forEach(lesson => {
                        if (lesson.words) {
                            lesson.words.forEach(w => {
                                words.push({
                                    hanzi: w.hanzi,
                                    pinyin: w.pinyin,
                                    meaning: w.meaning,
                                    type: w.type || w.pos || '',
                                    level: level
                                });
                            });
                        }
                    });
                } else if (unit.words) {
                    unit.words.forEach(w => {
                        words.push({
                            hanzi: w.hanzi,
                            pinyin: w.pinyin,
                            meaning: w.meaning,
                            type: w.type || w.pos || '',
                            level: level
                        });
                    });
                }
            });
            return words;
        }

        return words;
    }

    async function buildIndex() {
        const fetches = DATA_SOURCES.map(async (src) => {
            try {
                const res = await fetch(src.file);
                if (!res.ok) return [];
                const data = await res.json();
                return flattenData(data, src.level);
            } catch (e) {
                console.warn(`Search: Could not load ${src.file}`, e);
                return [];
            }
        });

        const results = await Promise.all(fetches);
        wordIndex = results.flat();

        // Deduplicate by hanzi+level (same word might appear from different sources)
        const seen = new Set();
        wordIndex = wordIndex.filter(w => {
            const key = `${w.hanzi}|${w.level}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        indexReady = true;
        console.log(`Search index built: ${wordIndex.length} words across ${DATA_SOURCES.length} levels.`);
    }

    // --- Strip Pinyin Tones ---
    // Converts accented vowels to plain so "ai" matches "ài"
    function stripTones(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // --- Search ---
    function searchWords(query) {
        if (!indexReady || !query || query.trim().length === 0) return [];

        const q = query.trim().toLowerCase();
        const qStripped = stripTones(q);

        const results = [];
        for (let i = 0; i < wordIndex.length && results.length < 10; i++) {
            const w = wordIndex[i];

            // Hanzi match
            if (w.hanzi.includes(q)) {
                results.push(w);
                continue;
            }

            // Pinyin match (tone-insensitive)
            const pinyinLower = w.pinyin.toLowerCase();
            if (pinyinLower.includes(q) || stripTones(pinyinLower).includes(qStripped)) {
                results.push(w);
                continue;
            }

            // Meaning match
            if (w.meaning.toLowerCase().includes(q)) {
                results.push(w);
                continue;
            }
        }

        return results;
    }

    // --- UI ---

    function initSearchUI() {
        const input = document.getElementById('global-search');
        if (!input) return;

        // Move the dropdown out of the hero (clip-path clips it) and into <body>
        const dropdown = document.getElementById('search-results');
        if (!dropdown) return;
        document.body.appendChild(dropdown);

        let debounceTimer = null;

        function positionDropdown() {
            const rect = input.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY + 6) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.width = rect.width + 'px';
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = input.value;
                if (query.trim().length === 0) {
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                    return;
                }

                if (!indexReady) {
                    dropdown.innerHTML = '<div class="search-item search-loading">Loading search index...</div>';
                    positionDropdown();
                    dropdown.style.display = 'block';
                    return;
                }

                const results = searchWords(query);
                renderResults(results, dropdown, query);
                positionDropdown();
            }, 200);
        });

        // Reposition on scroll/resize while open
        window.addEventListener('scroll', () => {
            if (dropdown.style.display === 'block') positionDropdown();
        }, { passive: true });
        window.addEventListener('resize', () => {
            if (dropdown.style.display === 'block') positionDropdown();
        });

        // Close dropdown on Escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
                input.blur();
            }
        });

        // Close dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container') && !e.target.closest('.search-results')) {
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            }
        });
    }

    function renderResults(results, dropdown, query) {
        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-item search-empty">No results found.</div>';
            dropdown.style.display = 'block';
            return;
        }

        const q = query.trim().toLowerCase();

        dropdown.innerHTML = results.map(w => {
            const href = `level.html?level=${w.level}&highlight=${encodeURIComponent(w.hanzi)}`;
            return `
                <a href="${href}" class="search-item">
                    <span class="search-hanzi">${highlight(w.hanzi, q)}</span>
                    <span class="search-pinyin">${highlight(w.pinyin, q)}</span>
                    <span class="search-meaning">${highlight(w.meaning, q)}</span>
                    <span class="search-level">HSK ${w.level}</span>
                </a>
            `;
        }).join('');
        dropdown.style.display = 'block';
    }

    // Highlight matching substring in text
    function highlight(text, query) {
        if (!query) return text;

        // Try exact match first
        const idx = text.toLowerCase().indexOf(query);
        if (idx !== -1) {
            const before = text.substring(0, idx);
            const match = text.substring(idx, idx + query.length);
            const after = text.substring(idx + query.length);
            return `${before}<mark>${match}</mark>${after}`;
        }

        // Try tone-stripped match for pinyin
        const stripped = stripTones(text.toLowerCase());
        const strippedQuery = stripTones(query);
        const sIdx = stripped.indexOf(strippedQuery);
        if (sIdx !== -1) {
            const before = text.substring(0, sIdx);
            const match = text.substring(sIdx, sIdx + strippedQuery.length);
            const after = text.substring(sIdx + strippedQuery.length);
            return `${before}<mark>${match}</mark>${after}`;
        }

        return text;
    }

    // --- Init ---
    buildIndex();
    initSearchUI();
})();
