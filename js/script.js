/**
 * =======================================================================================
 * Kaster Protocol - Reference Implementation
 * =======================================================================================
 * This is a single, bundled JavaScript file containing all the necessary logic
 * for the Kaster interface. It is wrapped in an Immediately Invoked Function
 * Expression (IIFE) to prevent polluting the global scope.
 *
 * The file is organized into the following logical modules:
 *
 * 1.  i18n.js .................... Internationalization and language management.
 * 2.  kaster-db.js ............... IndexedDB wrapper for local data persistence.
 * 3.  kaster-api.js .............. API wrapper for interacting with the Kaspa blockDAG.
 * 4.  Theme Management ........... Handles light and dark theme switching.
 * 5.  common.js .................. Shared UI logic, wallet connection, and modals.
 * 6.  Terms Management ........... UI logic for the content filtering modal.
 * 7.  script.js .................. Main logic for the index page (thread list).
 * 8.  thread.js .................. Logic for the single thread view page.
 * 9.  Refresh Functions .......... Handlers for manual data refreshing.
 * 10. Router ..................... Simple client-side router to switch between pages.
 *
 * =======================================================================================
 */

(function() {
        // =================================================================
        // --- i18n.js (Internationalization System) ---
        // =================================================================
        window.i18n = {
            currentLang: 'en',
            // Reference to external translations
            translations: window.translations,

            // Minimal fallback if external translations are not loaded
            _fallbackTranslations: {
                en: {
                    'misc.loading': 'Loading...',
                    'error.init_error': 'Initialization error.'
                },
                fr: {
                    'misc.loading': 'Chargement...',
                    'error.init_error': 'Erreur d\'initialisation.'
                }
            },

            init() {
                // Retrieve saved language or use English by default
                const savedLang = localStorage.getItem('kaster_language') || 'en';
                this.setLanguage(savedLang, false);

                // Add event listener for the language selector
                const langSelect = document.getElementById('language-select');
                if (langSelect) {
                    langSelect.value = this.currentLang;
                    langSelect.addEventListener('change', (e) => {
                        this.setLanguage(e.target.value);
                    });
                }
            },

            t(key, params = {}) {
                // First, try external translations (window.translations)
                const externalTranslations = window.translations || {};
                let langTranslations = externalTranslations[this.currentLang];
                let translation = null;

                // If found in external translations
                if (langTranslations && langTranslations[key]) {
                    translation = langTranslations[key];
                } else {
                    // Try the fallback language (English) in external translations
                    const fallbackLangTranslations = externalTranslations['en'];
                    if (fallbackLangTranslations && fallbackLangTranslations[key]) {
                        translation = fallbackLangTranslations[key];
                    } else {
                        // Use the internal minimal fallback
                        const internalTranslations = this._fallbackTranslations[this.currentLang] || this._fallbackTranslations['en'];
                        translation = internalTranslations[key] || key;

                        // Warn only if the translation does not exist anywhere
                        if (!internalTranslations[key]) {
                            console.warn(`Translation missing for key: ${key} in language: ${this.currentLang}`);
                        }
                    }
                }

                // Replace parameters in the translation
                Object.keys(params).forEach(param => {
                    translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
                });

                return translation;
            },

            setLanguage(lang, updateStorage = true) {
                if (!this.translations[lang]) {
                    console.warn(`Language ${lang} not supported`);
                    return;
                }

                this.currentLang = lang;

                // Save preference
                if (updateStorage) {
                    localStorage.setItem('kaster_language', lang);
                }

                // Update selector
                const langSelect = document.getElementById('language-select');
                if (langSelect) {
                    langSelect.value = lang;
                }

                // Update all texts
                this.updateAllTexts();

                // Update open modals language if any
                this.updateOpenModalsLanguage(lang);

                console.log(`Language changed to: ${lang}`);
            },

            updateOpenModalsLanguage(lang) {
                // Check if legal consent modal is open and update it
                const legalModal = document.getElementById('legalConsentModal');
                if (legalModal && legalModal.classList.contains('modal-visible')) {
                    const languageSelect = document.getElementById('legalLanguageSelect');
                    if (languageSelect) {
                        languageSelect.value = lang;
                    }
                    
                    // Temporarily change language for the modal
                    const originalLang = this.currentLang;
                    this.currentLang = lang;
                    
                    // Call the global function to update modal translations
                    if (typeof updateLegalModalTranslations === 'function') {
                        updateLegalModalTranslations();
                    }
                    
                    this.currentLang = originalLang;
                    console.log(`🌐 Legal consent modal language updated to: ${lang}`);
                }

                // Check if first visit modal is open and update it
                const firstVisitModal = document.getElementById('firstVisitModal');
                if (firstVisitModal && firstVisitModal.classList.contains('modal-visible')) {
                    const languageSelect = document.getElementById('demoLanguageSelect');
                    if (languageSelect) {
                        languageSelect.value = lang;
                    }
                    
                    // Temporarily change language for the modal
                    const originalLang = this.currentLang;
                    this.currentLang = lang;
                    
                    // Call the global function to update modal translations
                    if (typeof updateFirstVisitModalTranslations === 'function') {
                        updateFirstVisitModalTranslations();
                    }
                    
                    this.currentLang = originalLang;
                    console.log(`🌐 First visit modal language updated to: ${lang}`);
                }

                // Update thread creation form language selector
                const threadLanguageSelect = document.getElementById('thread-language-input');
                if (threadLanguageSelect) {
                    threadLanguageSelect.value = lang;
                    console.log(`🌐 Thread creation form language updated to: ${lang}`);
                }
            },

            updateAllTexts() {
                // Update all elements with data-i18n
                document.querySelectorAll('[data-i18n]').forEach(element => {
                    const key = element.dataset.i18n;
                    const translated = this.t(key);

                    if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'submit')) {
                        element.value = translated;
                    } else if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
                        element.placeholder = translated;
                    } else if (element.tagName === 'TEXTAREA' && element.placeholder !== undefined) {
                        element.placeholder = translated;
                    } else {
                        // For elements containing HTML (like links in reply_warning)
                        if (translated.includes('<')) {
                            // Specifically handle the reply_warning case with a link
                            if (key === 'thread.reply_warning_csp') {
                                // Now that the translation is plain text, use textContent
                                element.textContent = translated;
                            } else {
                                // For other cases, use textContent for security
                                element.textContent = translated;
                            }
                        } else {
                            element.textContent = translated;
                        }
                    }
                });

                // Update placeholders with data-i18n-placeholder
                document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                    const key = element.dataset.i18nPlaceholder;
                    const translated = this.t(key);
                    element.placeholder = translated;
                });

                // Update titles with data-i18n-title
                document.querySelectorAll('[data-i18n-title]').forEach(element => {
                    const key = element.dataset.i18nTitle;
                    const translated = this.t(key);
                    element.title = translated;
                });

                // Update predefined themes in the datalist
                this.updateThemeOptions();

                // Update dynamic filters
                this.updateFilterLabels();

                // Reformat all existing dates according to the new language
                this.updateDatesFormat();

                // Update page title
                document.title = this.t('seo.page_title');

                // Update SEO meta tags
                this.updateSEOMetaTags();

                // Update HTML lang attribute
                document.documentElement.lang = this.currentLang;
            },

            updateThemeOptions() {
                const datalist = document.getElementById('themes-datalist');
                if (datalist) {
                    const options = datalist.querySelectorAll('option');
                    const themeMap = {
                        'Général': 'theme.general',
                        'General': 'theme.general',
                        'Technologie': 'theme.technology',
                        'Technology': 'theme.technology',
                        'Kaspa': 'theme.kaspa',
                        'Gaming': 'theme.gaming'
                    };

                    options.forEach(option => {
                        const key = themeMap[option.value] || themeMap[option.textContent];
                        if (key) {
                            const translated = this.t(key);
                            option.value = translated;
                            option.textContent = translated;
                        }
                    });
                }
            },

            updateFilterLabels() {
                // Update "All themes" and "All languages" options
                const themeFilter = document.getElementById('theme-filter');
                const langFilter = document.getElementById('language-filter');

                if (themeFilter && themeFilter.options.length > 0) {
                    themeFilter.options[0].textContent = this.t('index.filters.all_themes');
                }

                if (langFilter && langFilter.options.length > 0) {
                    langFilter.options[0].textContent = this.t('index.filters.all_languages');
                }

                // Update sorting options
                const sortFilter = document.getElementById('sort-filter');
                if (sortFilter && sortFilter.options.length > 1) {
                    sortFilter.options[0].textContent = this.t('index.filters.recent');
                    sortFilter.options[1].textContent = this.t('index.filters.priority');
                }
            },

            updateDatesFormat() {
                const locale = this.currentLang === 'en' ? 'en-US' : 'fr-FR';

                // Reformat dates in the thread list
                document.querySelectorAll('.thread-meta span strong').forEach(dateElement => {
                    // Check if it's a date element (contains a valid date)
                    const text = dateElement.textContent;
                    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/\d{1,2}\.\d{1,2}\.\d{4}/);

                    if (dateMatch) {
                        try {
                            // Extract date from parent DOM for reformatting
                            const threadItem = dateElement.closest('.thread-item');
                            if (threadItem && threadItem.dataset.txid) {
                                // Look in thread data if available
                                if (window.currentState && window.currentState.allThreads) {
                                    const thread = window.currentState.allThreads.find(t => t.txid === threadItem.dataset.txid);
                                    if (thread && thread.block_time) {
                                        dateElement.textContent = new Date(thread.block_time).toLocaleString(locale);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('Error reformatting thread date:', e);
                        }
                    }
                });

                // Reformat date on the thread page (main thread)
                const threadDate = document.getElementById('thread-date');
                if (threadDate && window.currentState && window.currentState.threadData) {
                    try {
                        threadDate.textContent = new Date(window.currentState.threadData.block_time).toLocaleString(locale);
                    } catch (e) {
                        console.warn('Error reformatting main thread date:', e);
                    }
                }

                // Reformat dates in replies
                document.querySelectorAll('.reply .metadata-line span').forEach(dateSpan => {
                    // Check if it's a date (not "By:" or username)
                    const text = dateSpan.textContent;
                    const hasColon = text.includes(':');
                    const hasDatePattern = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/\d{1,2}\.\d{1,2}\.\d{4}/);

                    if (hasColon && hasDatePattern && !text.includes('Par:') && !text.includes('By:')) {
                        try {
                            // Try to parse and reformat
                            const parsedDate = new Date(text);
                            if (!isNaN(parsedDate.getTime())) {
                                dateSpan.textContent = parsedDate.toLocaleString(locale);
                            }
                        } catch (e) {
                            console.warn('Error reformatting reply date:', e);
                        }
                    }
                });
            },

            updateSEOMetaTags() {
                // Update SEO meta tags with translations
                const metaDescription = document.getElementById('meta-description');
                if (metaDescription) {
                    metaDescription.setAttribute('content', this.t('seo.meta_description'));
                }

                const metaKeywords = document.getElementById('meta-keywords');
                if (metaKeywords) {
                    metaKeywords.setAttribute('content', this.t('seo.meta_keywords'));
                }

                const pageTitle = document.getElementById('page-title');
                if (pageTitle) {
                    pageTitle.textContent = this.t('seo.page_title');
                }

                // Open Graph meta tags
                const ogTitle = document.getElementById('og-title');
                if (ogTitle) {
                    ogTitle.setAttribute('content', this.t('seo.og_title'));
                }

                const ogDescription = document.getElementById('og-description');
                if (ogDescription) {
                    ogDescription.setAttribute('content', this.t('seo.og_description'));
                }

                // Twitter Card meta tags
                const twitterTitle = document.getElementById('twitter-title');
                if (twitterTitle) {
                    twitterTitle.setAttribute('content', this.t('seo.twitter_title'));
                }

                const twitterDescription = document.getElementById('twitter-description');
                if (twitterDescription) {
                    twitterDescription.setAttribute('content', this.t('seo.twitter_description'));
                }

                console.log(`🌐 SEO meta tags updated for language: ${this.currentLang}`);
            }
        };

        // =================================================================
        // --- kaster-db.js (Unchanged) ---
        // =================================================================
        const KASTER_DB_NAME = 'KasterDB', KASTER_DB_VERSION = 6, HIDDEN_MESSAGES_STORE = 'hiddenMessages', BLACKLISTED_WALLETS_STORE = 'blacklistedWallets', THREAD_VISITS_STORE = 'threadVisits', THREADS_CACHE_STORE = 'threadsCache', MESSAGES_CACHE_STORE = 'messagesCache', CACHE_METADATA_STORE = 'cacheMetadata', WALLET_LAST_TX_STORE = 'walletLastTransactions', ARCHIVED_THREADS_STORE = 'archivedThreads', FILTERED_TERMS_STORE = 'filteredTerms';
        window.kasterDB = {
            db: null,
            async init() {
                return new Promise(async (resolve, reject) => {
                    if (this.db) return resolve();
                    const request = indexedDB.open(KASTER_DB_NAME, KASTER_DB_VERSION);
                    request.onerror = e => { console.error("DB error:", e.target.error); reject("IndexedDB error"); };
                    request.onsuccess = async e => {
                        this.db = e.target.result;
                        // Initialize default filtered terms if necessary
                        try {
                            await this.initializeDefaultFilteredTerms();
                        } catch (error) {
                            console.warn('Error initializing filtered terms:', error);
                        }
                        resolve();
                    };
                    request.onupgradeneeded = e => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(HIDDEN_MESSAGES_STORE)) db.createObjectStore(HIDDEN_MESSAGES_STORE, { keyPath: 'txid' });
                        if (!db.objectStoreNames.contains(BLACKLISTED_WALLETS_STORE)) db.createObjectStore(BLACKLISTED_WALLETS_STORE, { keyPath: 'address' });
                        if (!db.objectStoreNames.contains(THREAD_VISITS_STORE)) db.createObjectStore(THREAD_VISITS_STORE, { keyPath: 'txid' });
                        if (!db.objectStoreNames.contains(THREADS_CACHE_STORE)) db.createObjectStore(THREADS_CACHE_STORE, { keyPath: 'txid' });
                        if (!db.objectStoreNames.contains(MESSAGES_CACHE_STORE)) db.createObjectStore(MESSAGES_CACHE_STORE, { keyPath: 'txid' });
                        if (!db.objectStoreNames.contains(CACHE_METADATA_STORE)) db.createObjectStore(CACHE_METADATA_STORE, { keyPath: 'key' });
                        if (!db.objectStoreNames.contains(WALLET_LAST_TX_STORE)) db.createObjectStore(WALLET_LAST_TX_STORE, { keyPath: 'address' });
                        if (!db.objectStoreNames.contains(ARCHIVED_THREADS_STORE)) db.createObjectStore(ARCHIVED_THREADS_STORE, { keyPath: 'txid' });
                        if (!db.objectStoreNames.contains(FILTERED_TERMS_STORE)) db.createObjectStore(FILTERED_TERMS_STORE, { keyPath: 'id', autoIncrement: true });
                    };
                });
            },
            async hideMessage(txid) {
                const tx = this.db.transaction([HIDDEN_MESSAGES_STORE, THREADS_CACHE_STORE, MESSAGES_CACHE_STORE], 'readwrite');

                // Add to the list of hidden messages
                tx.objectStore(HIDDEN_MESSAGES_STORE).put({ txid, hiddenAt: new Date() });

                // Also delete from cache for consistency
                tx.objectStore(THREADS_CACHE_STORE).delete(txid);
                tx.objectStore(MESSAGES_CACHE_STORE).delete(txid);

                console.log(`🗑️ Thread/Message ${txid} hidden and removed from cache`);

                return tx.complete;
            },
            async blacklistWallet(address) {
                const tx = this.db.transaction([BLACKLISTED_WALLETS_STORE, THREADS_CACHE_STORE, MESSAGES_CACHE_STORE], 'readwrite');

                // Add to the list of blacklisted wallets
                tx.objectStore(BLACKLISTED_WALLETS_STORE).put({ address, blacklistedAt: new Date() });

                // Delete all threads and messages from this wallet from the cache
                const threadsStore = tx.objectStore(THREADS_CACHE_STORE);
                const messagesStore = tx.objectStore(MESSAGES_CACHE_STORE);

                // Iterate and delete threads from this wallet
                const threadsReq = threadsStore.getAll();
                threadsReq.onsuccess = () => {
                    for (const thread of threadsReq.result) {
                        if (thread.sender_address === address) {
                            threadsStore.delete(thread.txid);
                        }
                    }
                };

                // Iterate and delete messages from this wallet
                const messagesReq = messagesStore.getAll();
                messagesReq.onsuccess = () => {
                    for (const message of messagesReq.result) {
                        if (message.sender_address === address) {
                            messagesStore.delete(message.txid);
                        }
                    }
                };

                console.log(`🚫 Wallet ${address} blacklisted and all its content removed from cache`);

                return tx.complete;
            },
            async getHiddenMessages() { return new Promise((resolve, reject) => { const req = this.db.transaction([HIDDEN_MESSAGES_STORE], 'readonly').objectStore(HIDDEN_MESSAGES_STORE).getAll(); req.onsuccess = () => resolve(req.result.map(item => item.txid)); req.onerror = e => reject(e.target.error); }); },
            async getBlacklistedWallets() { return new Promise((resolve, reject) => { const req = this.db.transaction([BLACKLISTED_WALLETS_STORE], 'readonly').objectStore(BLACKLISTED_WALLETS_STORE).getAll(); req.onsuccess = () => resolve(req.result.map(item => item.address)); req.onerror = e => reject(e.target.error); }); },
            async updateThreadVisit(txid, replyCount, timestamp) {
                const tx = this.db.transaction([THREAD_VISITS_STORE], 'readwrite');
                tx.objectStore(THREAD_VISITS_STORE).put({ txid, lastViewedReplies: replyCount, lastVisitTimestamp: timestamp });
                return tx.complete;
            },
            async getThreadVisit(txid) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([THREAD_VISITS_STORE], 'readonly').objectStore(THREAD_VISITS_STORE).get(txid);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },
            async getAllThreadVisits() {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([THREAD_VISITS_STORE], 'readonly').objectStore(THREAD_VISITS_STORE).getAll();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            // === Cache management methods ===
            async setCacheMetadata(key, timestamp) {
                const tx = this.db.transaction([CACHE_METADATA_STORE], 'readwrite');
                tx.objectStore(CACHE_METADATA_STORE).put({ key, timestamp });
                return tx.complete;
            },

            async getCacheMetadata(key) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([CACHE_METADATA_STORE], 'readonly').objectStore(CACHE_METADATA_STORE).get(key);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            async isCacheValid(key, maxAgeMs = 30000) {
                try {
                    const metadata = await this.getCacheMetadata(key);
                    if (!metadata) return false;
                    return (Date.now() - metadata.timestamp) < maxAgeMs;
                } catch (e) {
                    return false;
                }
            },

            async cacheThreads(threads) {
                const tx = this.db.transaction([THREADS_CACHE_STORE, CACHE_METADATA_STORE], 'readwrite');
                const threadsStore = tx.objectStore(THREADS_CACHE_STORE);
                const metadataStore = tx.objectStore(CACHE_METADATA_STORE);

                // Cache each thread
                for (const thread of threads) {
                    threadsStore.put({ ...thread, cachedAt: Date.now() });
                }

                // Update global cache metadata
                metadataStore.put({ key: 'threads_list', timestamp: Date.now() });

                return tx.complete;
            },

            async getCachedThreads() {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([THREADS_CACHE_STORE], 'readonly').objectStore(THREADS_CACHE_STORE).getAll();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            async cacheThread(txid, messages, threadInfo) {
                const tx = this.db.transaction([MESSAGES_CACHE_STORE, CACHE_METADATA_STORE], 'readwrite');
                const messagesStore = tx.objectStore(MESSAGES_CACHE_STORE);
                const metadataStore = tx.objectStore(CACHE_METADATA_STORE);

                // Cache each message
                for (const message of messages) {
                    messagesStore.put({ ...message, cachedAt: Date.now() });
                }

                // Update cache metadata for this thread
                metadataStore.put({ key: `thread_${txid}`, timestamp: Date.now() });

                return tx.complete;
            },

            async getCachedThread(txid) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([MESSAGES_CACHE_STORE], 'readonly').objectStore(MESSAGES_CACHE_STORE).getAll();
                    req.onsuccess = () => {
                        const allMessages = req.result;
                        const threadMessages = allMessages.filter(msg =>
                            msg.txid === txid || msg.parentTxid === txid
                        );

                        if (threadMessages.length === 0) {
                            resolve(null);
                            return;
                        }

                        const threadInfo = threadMessages.find(msg => msg.txid === txid);
                        const replies = threadMessages.filter(msg => msg.txid !== txid);

                        resolve({
                            messages: [threadInfo, ...replies.sort((a, b) => new Date(a.block_time) - new Date(b.block_time))],
                            thread_info: threadInfo
                        });
                    };
                    req.onerror = e => reject(e.target.error);
                });
            },

            async getMissingThreads(currentThreadTxids) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([THREADS_CACHE_STORE], 'readonly').objectStore(THREADS_CACHE_STORE).getAll();
                    req.onsuccess = () => {
                        const cachedThreads = req.result;
                        const missingThreads = cachedThreads.filter(thread =>
                            !currentThreadTxids.includes(thread.txid)
                        );
                        resolve(missingThreads);
                    };
                    req.onerror = e => reject(e.target.error);
                });
            },

            async cleanExpiredCache(maxAgeMs = 1296000000) { // 15 days by default
                const cutoffTime = Date.now() - maxAgeMs;

                const tx = this.db.transaction([THREADS_CACHE_STORE, MESSAGES_CACHE_STORE], 'readwrite');
                const threadsStore = tx.objectStore(THREADS_CACHE_STORE);
                const messagesStore = tx.objectStore(MESSAGES_CACHE_STORE);

                // Clean expired threads
                const threadsReq = threadsStore.getAll();
                threadsReq.onsuccess = () => {
                    for (const thread of threadsReq.result) {
                        if (thread.cachedAt < cutoffTime) {
                            threadsStore.delete(thread.txid);
                        }
                    }
                };

                // Clean expired messages
                const messagesReq = messagesStore.getAll();
                messagesReq.onsuccess = () => {
                    for (const message of messagesReq.result) {
                        if (message.cachedAt < cutoffTime) {
                            messagesStore.delete(message.txid);
                        }
                    }
                };

                return tx.complete;
            },

            // === Wallet last transaction management methods ===
            async setWalletLastTransaction(address, txid, timestamp = Date.now()) {
                const tx = this.db.transaction([WALLET_LAST_TX_STORE], 'readwrite');
                tx.objectStore(WALLET_LAST_TX_STORE).put({ address, lastTxid: txid, lastCheckTimestamp: timestamp });
                return tx.complete;
            },

            async getWalletLastTransaction(address) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([WALLET_LAST_TX_STORE], 'readonly').objectStore(WALLET_LAST_TX_STORE).get(address);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            // === Reply count cache management methods ===
            async setCachedReplyCount(threadTxid, replyCount, timestamp = Date.now()) {
                const tx = this.db.transaction([CACHE_METADATA_STORE], 'readwrite');
                const key = `reply_count_${threadTxid}`;
                tx.objectStore(CACHE_METADATA_STORE).put({
                    key,
                    timestamp,
                    replyCount: replyCount
                });
                return tx.complete;
            },

            async getCachedReplyCount(threadTxid) {
                return new Promise((resolve, reject) => {
                    const key = `reply_count_${threadTxid}`;
                    const req = this.db.transaction([CACHE_METADATA_STORE], 'readonly').objectStore(CACHE_METADATA_STORE).get(key);
                    req.onsuccess = () => {
                        const result = req.result;
                        if (result && result.replyCount !== undefined) {
                            resolve({
                                replyCount: result.replyCount,
                                timestamp: result.timestamp
                            });
                        } else {
                            resolve(null);
                        }
                    };
                    req.onerror = e => reject(e.target.error);
                });
            },

            // === Archived threads management methods ===
            async markThreadAsArchived(txid, reason = 'title_too_long') {
                const tx = this.db.transaction([ARCHIVED_THREADS_STORE], 'readwrite');
                tx.objectStore(ARCHIVED_THREADS_STORE).put({
                    txid,
                    archivedAt: Date.now(),
                    reason
                });
                console.log(`📦 Thread ${txid} marked as archived (${reason})`);
                return tx.complete;
            },

            async getArchivedThreads() {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([ARCHIVED_THREADS_STORE], 'readonly').objectStore(ARCHIVED_THREADS_STORE).getAll();
                    req.onsuccess = () => resolve(req.result.map(item => item.txid));
                    req.onerror = e => reject(e.target.error);
                });
            },

            async isThreadArchived(txid) {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([ARCHIVED_THREADS_STORE], 'readonly').objectStore(ARCHIVED_THREADS_STORE).get(txid);
                    req.onsuccess = () => resolve(!!req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            // === Filtered terms management methods ===
            async addFilteredTerm(term, language = 'fr') {
                const tx = this.db.transaction([FILTERED_TERMS_STORE], 'readwrite');
                tx.objectStore(FILTERED_TERMS_STORE).add({
                    term: term.toLowerCase().trim(),
                    language: language,
                    addedAt: Date.now(),
                    userAdded: true // Mark as user-added
                });
                console.log(`🚫 Unwanted term added: "${term}" (${language})`);
                return tx.complete;
            },

            async removeFilteredTerm(id) {
                const tx = this.db.transaction([FILTERED_TERMS_STORE], 'readwrite');
                tx.objectStore(FILTERED_TERMS_STORE).delete(id);
                console.log(`✅ Filtered term removed: ID ${id}`);
            },

            async getFilteredTerms() {
                return new Promise((resolve, reject) => {
                    const req = this.db.transaction([FILTERED_TERMS_STORE], 'readonly').objectStore(FILTERED_TERMS_STORE).getAll();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = e => reject(e.target.error);
                });
            },

            async initializeDefaultFilteredTerms() {
                // Check if terms already exist
                const existingTerms = await this.getFilteredTerms();
                if (existingTerms.length > 0) {
                    console.log(`📋 ${existingTerms.length} filtered terms already configured`);
                    return;
                }

                // No more default terms - user adds what they want
                console.log('💡 No default terms - system fully customizable by user');
            },

            async containsFilteredTerms(text) {
                if (!text || typeof text !== 'string') return { hasFilteredTerm: false, matchedTerms: [] };

                const filteredTerms = await this.getFilteredTerms();
                const textLower = text.toLowerCase();
                const matchedTerms = [];

                for (const termData of filteredTerms) {
                    if (textLower.includes(termData.term)) {
                        matchedTerms.push(termData);
                    }
                }

                return {
                    hasFilteredTerm: matchedTerms.length > 0,
                    matchedTerms: matchedTerms
                };
            }
        };

        // =================================================================
        // --- kaster-api.js
        // This file implements the logic for encoding/decoding payloads
        // and interacting with the Kaspa network according to the Kaster Protocol specifications.
        // =================================================================
        const API_BASE_URL = 'https://api.kaspa.org';
        const PROTOCOL_ADDRESS = 'kaspa:qz8sa5erejgulv5u8q795ssgsv8rx3m488ktwvfqhc3rqmzc9342j0525pnmh';
        const AMOUNT_TO_SEND_SOMPIS = 12000000; // 0.12 KAS
        const MAX_TITLE_BYTES = 40, MAX_MESSAGE_BYTES = 400; // Consistent limit of 40 bytes

        window.kasterAPI = {
            // System for pooling ongoing calls to avoid API duplicates
            _pendingThreadCalls: new Map(),

            async fetchThreads() {
                // Check if cache is valid (adaptive delay)
                const refreshDelay = getRefreshDelay(window.currentState);
                const isCacheValid = await window.kasterDB.isCacheValid('threads_list', refreshDelay);

                if (isCacheValid) {
                    console.log('🟢 Using cache for thread list');

                    // Retrieve cached threads
                    const cachedThreads = await window.kasterDB.getCachedThreads();

                    // Clean expired cache in the background
                    window.kasterDB.cleanExpiredCache().catch(e => console.warn('Error cleaning cache:', e));

                    return cachedThreads.map(thread => ({
                        ...thread,
                        cachedAt: undefined // Remove cachedAt property for display
                    }));
                }

                console.log('🔄 API call to retrieve threads with optimization');

                // Retrieve threads with optimization by tracking the last transaction
                const { threads, currentThreadTxids } = await this.fetchOptimizedThreadsList();

                // Retrieve missing threads from cache (those no longer in the last 200 transactions)
                try {
                    const missingThreads = await window.kasterDB.getMissingThreads(currentThreadTxids);
                    const archivedThreadIds = await window.kasterDB.getArchivedThreads();

                    // Process all missing threads
                    for (const thread of missingThreads) {
                        // Mark as archived (no longer in the current 200)
                        thread.archived = true;
                        thread.cachedAt = undefined;

                        // Permanently save archived status in DB
                        if (!archivedThreadIds.includes(thread.txid)) {
                            try {
                                await window.kasterDB.markThreadAsArchived(thread.txid, 'out_of_recent_transactions');
                                console.log(`📦 Thread ${thread.txid} saved as archived (out of last 200 TXs)`);
                            } catch (e) {
                                console.warn(`Error saving archive ${thread.txid}:`, e);
                            }
                        }
                    }

                    // Combine current threads and archived threads
                    threads.push(...missingThreads);

                    console.log(`📦 ${missingThreads.length} threads retrieved from cache`);
                } catch (e) {
                    console.warn('Error retrieving missing threads:', e);
                }

                // Cache new threads
                try {
                    await window.kasterDB.cacheThreads(threads.filter(t => !t.archived));
                    console.log(`💾 ${threads.filter(t => !t.archived).length} threads cached`);
                } catch (e) {
                    console.warn('Error caching threads:', e);
                }

                return threads;
            },

            async fetchOptimizedThreadsList() {
                try {
                    // Retrieve the last checked transaction for the protocol address
                    const lastTxInfo = await window.kasterDB.getWalletLastTransaction(PROTOCOL_ADDRESS);

                    console.log(`🔍 Optimizing threads from ${PROTOCOL_ADDRESS.substring(0, 15)}...`);
                    if (lastTxInfo) {
                        console.log(`📋 Last checked thread TX: ${lastTxInfo.lastTxid.substring(0, 10)}... at ${new Date(lastTxInfo.lastCheckTimestamp).toLocaleTimeString()}`);
                    }

                    // Retrieve protocol transactions (limit 200)
                    const endpoint = `${API_BASE_URL}/addresses/${PROTOCOL_ADDRESS}/full-transactions-page?limit=200&resolve_previous_outpoints=light`;
                    const response = await fetch(endpoint);
                    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                    const transactions = await response.json();

                    if (!transactions || transactions.length === 0) {
                        return { threads: [], currentThreadTxids: [] };
                    }

                    // STEP 1: Process ALL 200 transactions to get the complete reference of current threads
                    const allCurrentThreads = [];
                    const allCurrentThreadTxids = [];

                    for (const tx of transactions) {
                        try {
                            const decoded = this.decodeTransactionPayload(tx.payload);
                            // If decoding returns null (title > 40 characters), ignore completely
                            if (decoded && decoded.parentTxid === '0000000000000000000000000000000000000000000000000000000000000000') {
                                const thread = {
                                    ...decoded,
                                    txid: tx.transaction_id,
                                    sender_address: tx.inputs[0]?.previous_outpoint_address,
                                    block_time: new Date(tx.block_time).toISOString(),
                                    reply_count: 0 // Will be updated by updateThreadReplyCount
                                };
                                allCurrentThreads.push(thread);
                                allCurrentThreadTxids.push(thread.txid);
                            }
                        } catch (e) { /* Ignore invalid payloads */ }
                    }

                    let threadsToReturn = allCurrentThreads;
                    let isOptimized = false;

                    // STEP 2: Conditional optimization based on whether there are new transactions
                    if (lastTxInfo && lastTxInfo.lastTxid) {
                        const lastTxIndex = transactions.findIndex(tx => tx.transaction_id === lastTxInfo.lastTxid);

                        if (lastTxIndex !== -1) {
                            // Check if there are new transactions
                            const newTransactionsCount = lastTxIndex;

                            if (newTransactionsCount === 0) {
                                // NO new transactions - maximum optimization
                                try {
                                    const cachedThreads = await window.kasterDB.getCachedThreads();

                                    // Intelligently combine: current threads (reference) + cache for details
                                    const threadsMap = new Map();

                                    // First, retrieve the list of threads marked as archived in DB
                                    const archivedThreadIds = await window.kasterDB.getArchivedThreads();

                                    // Mark all cached threads according to DB status + current logic
                                    for (const cached of cachedThreads) {
                                        const isPermanentlyArchived = archivedThreadIds.includes(cached.txid);
                                        const isStillCurrent = allCurrentThreadTxids.includes(cached.txid);


                                        threadsMap.set(cached.txid, {
                                            ...cached,
                                            archived: isPermanentlyArchived || !isStillCurrent,
                                            cachedAt: undefined
                                        });
                                    }

                                    // Then add current threads that are not in cache
                                    allCurrentThreads.forEach(current => {
                                        if (!threadsMap.has(current.txid)) {
                                            threadsMap.set(current.txid, current); // Not archived because in current 200
                                        }
                                    });

                                    threadsToReturn = Array.from(threadsMap.values());
                                    isOptimized = true;
                                    console.log(`⚡ MAX Optimization: no new TX, cache + reference combination (${threadsToReturn.length} threads, ${threadsToReturn.filter(t => t.archived).length} archived)`);
                                } catch (e) {
                                    console.warn('Error retrieving cached threads:', e);
                                    threadsToReturn = allCurrentThreads; // Safe fallback
                                }
                            } else {
                                // There are new transactions
                                isOptimized = true;
                                console.log(`⚡ Optimization: ${newTransactionsCount} new transactions detected, full processing`);
                                // Use all current threads (complete reference)
                                threadsToReturn = allCurrentThreads;
                            }
                        } else {
                            console.log(`⚠️ Last checked thread TX not found in the last 200, full check`);
                            // No optimization possible
                            threadsToReturn = allCurrentThreads;
                        }
                    } else {
                        console.log(`🆕 First thread check, full processing`);
                        // First time, no optimization
                        threadsToReturn = allCurrentThreads;
                    }

                    // STEP 3: Update the last checked transaction
                    if (transactions.length > 0) {
                        const mostRecentTx = transactions[0];
                        await window.kasterDB.setWalletLastTransaction(PROTOCOL_ADDRESS, mostRecentTx.transaction_id, Date.now());

                        if (isOptimized) {
                            console.log(`✅ Efficient optimization: ${threadsToReturn.length} threads returned, last TX updated`);
                        }
                    }

                    return { threads: threadsToReturn, currentThreadTxids: allCurrentThreadTxids };

                } catch (error) {
                    console.warn(`Error during optimized thread retrieval:`, error);
                    // Fallback to classic method
                    return await this.fetchThreadsClassic();
                }
            },

            async fetchThreadsClassic() {
                console.log('📞 Fallback to classic thread retrieval');

                const endpoint = `${API_BASE_URL}/addresses/${PROTOCOL_ADDRESS}/full-transactions-page?limit=200&resolve_previous_outpoints=light`;
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                const transactions = await response.json();

                const threads = [];
                const currentThreadTxids = [];

                for (const tx of transactions) {
                    try {
                        const decoded = this.decodeTransactionPayload(tx.payload);
                        if (decoded && decoded.parentTxid === '0000000000000000000000000000000000000000000000000000000000000000') {
                            const thread = {
                                ...decoded,
                                txid: tx.transaction_id,
                                sender_address: tx.inputs[0]?.previous_outpoint_address,
                                block_time: new Date(tx.block_time).toISOString(),
                                reply_count: 0
                            };
                            threads.push(thread);
                            currentThreadTxids.push(thread.txid);
                        }
                    } catch (e) { /* Ignore invalid payloads */ }
                }

                return { threads, currentThreadTxids };
            },

            async fetchThread(txid) {
                // 1. Check if a call is already in progress for this thread
                if (this._pendingThreadCalls.has(txid)) {
                    console.log(`⚡ Call in progress detected for ${txid}, reusing result`);
                    return await this._pendingThreadCalls.get(txid);
                }

                // 2. Check if cache is valid for this thread (adaptive delay)
                const refreshDelay = getRefreshDelay(window.currentState);
                const isCacheValid = await window.kasterDB.isCacheValid(`thread_${txid}`, refreshDelay);

                if (isCacheValid) {
                    console.log(`🟢 Using cache for thread ${txid}`);

                    const cachedThread = await window.kasterDB.getCachedThread(txid);
                    if (cachedThread) {
                        // Clean cachedAt properties for display
                        cachedThread.messages = cachedThread.messages.map(msg => ({
                            ...msg,
                            cachedAt: undefined
                        }));

                        return cachedThread;
                    }
                }

                console.log(`🔄 API call to retrieve thread ${txid}`);

                // 3. Create the promise and store it for pooling
                const fetchPromise = this._executeFetchThread(txid);
                this._pendingThreadCalls.set(txid, fetchPromise);

                try {
                    const result = await fetchPromise;
                    return result;
                } finally {
                    // 4. Clean up the finished promise
                    this._pendingThreadCalls.delete(txid);
                }
            },

            async _executeFetchThread(txid) {
                // Step 1: Try to retrieve thread info from the threads cache
                let thread_info = null;
                try {
                    const cachedThreads = await window.kasterDB.getCachedThreads();
                    const cachedThreadInfo = cachedThreads.find(t => t.txid === txid);
                    if (cachedThreadInfo) {
                        thread_info = {
                            ...cachedThreadInfo,
                            cachedAt: undefined
                        };
                        console.log(`🟢 Thread info retrieved from threads cache`);
                    }
                } catch (e) {
                    console.warn('Error retrieving cached threads:', e);
                }

                // If not found in cache, make API call
                if (!thread_info) {
                    const threadResponse = await fetch(`${API_BASE_URL}/transactions/${txid}?resolve_previous_outpoints=light`);
                    if (!threadResponse.ok) throw new Error(`Thread not found: ${threadResponse.statusText}`);
                    const threadTx = await threadResponse.json();

                    thread_info = this.decodeTransactionPayload(threadTx.payload);
                    if (!thread_info) throw new Error("Invalid thread payload");

                    Object.assign(thread_info, {
                        txid: threadTx.transaction_id,
                        sender_address: threadTx.inputs[0]?.previous_outpoint_address,
                        block_time: new Date(threadTx.block_time).toISOString(),
                    });
                    console.log(`🔄 Thread info retrieved via API`);
                }

                // Step 2: Retrieve author's transactions in an optimized way
                const replies = await this.fetchOptimizedAuthorReplies(thread_info.sender_address, thread_info.txid);

                const allMessages = [thread_info, ...replies.sort((a, b) => new Date(a.block_time) - new Date(b.block_time))];
                const result = {
                    messages: allMessages,
                    thread_info: thread_info
                };

                // Cache the complete thread with its replies
                try {
                    await window.kasterDB.cacheThread(txid, allMessages, thread_info);
                    console.log(`💾 Thread ${txid} with ${replies.length} replies cached`);
                } catch (e) {
                    console.warn('Error caching complete thread:', e);
                }

                return result;
            },

            decodeTransactionPayload(payloadHex) {
                if (!payloadHex || payloadHex.length < 2) return null;

                // Detect if payload starts with '30' or '34' (ASCII for '0' or '4')
                // This indicates that the Kaspa API stored the hex as ASCII
                let actualPayloadHex = payloadHex;
                if (payloadHex.startsWith('30') || payloadHex.startsWith('34')) {
                    try {
                        // Decode ASCII hex payload to normal hex
                        let decodedString = '';
                        for (let i = 0; i < payloadHex.length; i += 2) {
                            const hexPair = payloadHex.substring(i, i + 2);
                            const byte = parseInt(hexPair, 16);
                            const char = String.fromCharCode(byte);
                            decodedString += char;
                        }

                        // If it looks like valid hex, use it
                        if (decodedString.match(/^[0-9a-fA-F]+$/) && decodedString.length >= 70) {
                            actualPayloadHex = decodedString;
                        }
                    } catch (e) {
                        // In case of error, use the original payload
                    }
                }

                try {
                    const buffer = this.hexToBytes(actualPayloadHex);
                    const view = new DataView(buffer.buffer);
                    let offset = 0;

                    const version = view.getUint8(offset); offset += 1;
                    if (version !== 4) return null;

                    const parentTxidBytes = buffer.slice(offset, offset + 32); offset += 32;
                    const parentTxid = Array.from(parentTxidBytes).map(b => b.toString(16).padStart(2, '0')).join('');

                    const themeLen = view.getUint16(offset, false); offset += 2;
                    const theme = new TextDecoder().decode(buffer.slice(offset, offset + themeLen)); offset += themeLen;

                    const langLen = view.getUint16(offset, false); offset += 2;
                    const language = new TextDecoder().decode(buffer.slice(offset, offset + langLen)); offset += langLen;

                    const priority = view.getUint8(offset); offset += 1;

                    const titleLen = view.getUint16(offset, false); offset += 2;
                    const title = new TextDecoder().decode(buffer.slice(offset, offset + titleLen)); offset += titleLen;

                    const msgLen = view.getUint16(offset, false); offset += 2;
                    const message = new TextDecoder().decode(buffer.slice(offset, offset + msgLen));

                    // Ignore threads whose title exceeds 40 bytes (not protocol compliant)
                    if (title && new TextEncoder().encode(title).length > 40) {
                        const titleBytes = new TextEncoder().encode(title).length;
                        console.log(`⚠️ Thread ignored: title too long (${titleBytes} > 40 bytes)`);
                        return null;
                    }

                    return { parentTxid, theme, language, priority, title, message };
                } catch (e) {
                    return null;
                }
            },

            hexToBytes(hex) {
                const bytes = new Uint8Array(hex.length / 2);
                for (let i = 0; i < bytes.length; i++) {
                    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
                }
                return bytes;
            },

            async fetchOptimizedAuthorReplies(authorAddress, threadTxid) {
                try {
                    // Retrieve the last checked transaction for this wallet
                    const lastTxInfo = await window.kasterDB.getWalletLastTransaction(authorAddress);

                    console.log(`🔍 Optimized reply check for ${authorAddress.substring(0, 10)}...`);
                    if (lastTxInfo) {
                        console.log(`📋 Last checked TX: ${lastTxInfo.lastTxid.substring(0, 10)}... at ${new Date(lastTxInfo.lastCheckTimestamp).toLocaleTimeString()}`);
                    }

                    // Retrieve author's transactions (limit 200)
                    const authorTxsResponse = await fetch(`${API_BASE_URL}/addresses/${authorAddress}/full-transactions-page?limit=200&resolve_previous_outpoints=light`);
                    if (!authorTxsResponse.ok) {
                        console.warn(`Could not retrieve transactions for ${authorAddress}`);
                        return [];
                    }

                    const authorTxs = await authorTxsResponse.json();
                    if (!authorTxs || authorTxs.length === 0) {
                        return [];
                    }

                    // STEP 1: Process ALL 200 transactions to get the complete reference of current replies
                    const allCurrentReplies = [];

                    for (const tx of authorTxs) {
                        try {
                            const decoded = this.decodeTransactionPayload(tx.payload);
                            if (decoded && decoded.parentTxid === threadTxid) {
                                allCurrentReplies.push({
                                    ...decoded,
                                    txid: tx.transaction_id,
                                    sender_address: tx.inputs[0]?.previous_outpoint_address,
                                    block_time: new Date(tx.block_time).toISOString(),
                                });
                            }
                        } catch(e) {
                            // Ignore invalid payloads
                        }
                    }

                    let repliesToReturn = allCurrentReplies;
                    let isOptimized = false;

                    // STEP 2: Conditional optimization based on whether there are new transactions
                    if (lastTxInfo && lastTxInfo.lastTxid) {
                        const lastTxIndex = authorTxs.findIndex(tx => tx.transaction_id === lastTxInfo.lastTxid);

                        if (lastTxIndex !== -1) {
                            // Check if there are new transactions
                            const newTransactionsCount = lastTxIndex;

                            if (newTransactionsCount === 0) {
                                // NO new transactions - maximum optimization
                                try {
                                    const cachedThread = await window.kasterDB.getCachedThread(threadTxid);

                                    if (cachedThread && cachedThread.messages) {
                                        // Retrieve old replies from cache
                                        const cachedReplies = cachedThread.messages.filter(msg =>
                                            msg.txid !== threadTxid && msg.parentTxid === threadTxid
                                        );

                                        // Combine: current replies (reference) + cache for old ones
                                        const repliesMap = new Map();

                                        // First, current replies (priority to fresh data)
                                        allCurrentReplies.forEach(current => repliesMap.set(current.txid, current));

                                        // Then add from cache replies that are no longer in the current 200
                                        cachedReplies.forEach(cached => {
                                            if (!repliesMap.has(cached.txid)) {
                                                repliesMap.set(cached.txid, {
                                                    ...cached,
                                                    cachedAt: undefined,
                                                    archived: true // Mark as archived because no longer in current 200
                                                });
                                            }
                                        });

                                        repliesToReturn = Array.from(repliesMap.values());
                                        isOptimized = true;
                                        console.log(`⚡ MAX Optimization replies: no new TX, cache + reference combination (${repliesToReturn.length} replies, ${repliesToReturn.filter(r => r.archived).length} archived)`);
                                    } else {
                                        // No cache available
                                        repliesToReturn = allCurrentReplies;
                                    }
                                } catch (e) {
                                    console.warn('Error retrieving cached replies:', e);
                                    repliesToReturn = allCurrentReplies; // Safe fallback
                                }
                            } else {
                                // There are new transactions
                                isOptimized = true;
                                console.log(`⚡ Optimization replies: ${newTransactionsCount} new transactions detected`);
                                // Use all current replies (complete reference)
                                repliesToReturn = allCurrentReplies;
                            }
                        } else {
                            console.log(`⚠️ Last known TX not found in the last 200, full check`);
                            // No optimization possible
                            repliesToReturn = allCurrentReplies;
                        }
                    } else {
                        console.log(`🆕 First check for this wallet, full processing`);
                        // First time, no optimization
                        repliesToReturn = allCurrentReplies;
                    }

                    // STEP 3: Update the last checked transaction
                    if (authorTxs.length > 0) {
                        const mostRecentTx = authorTxs[0]; // API returns TXs in reverse chronological order
                        await window.kasterDB.setWalletLastTransaction(authorAddress, mostRecentTx.transaction_id, Date.now());

                        if (isOptimized) {
                            console.log(`✅ Efficient reply optimization: ${repliesToReturn.length} replies returned, last TX updated`);
                        }
                    }

                    return repliesToReturn;

                } catch (error) {
                    console.warn(`Error during optimized reply retrieval for ${authorAddress}:`, error);
                    return [];
                }
            }
        };

        // =================================================================
        // --- Theme Management ---
        // =================================================================
        function initializeTheme() {
            // Retrieve saved theme or use light theme by default
            const savedTheme = localStorage.getItem('kaster_theme') || 'light';
            setTheme(savedTheme);

            // Configure toggle button
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', toggleTheme);
                updateThemeToggleButton();
            }
        }

        function setTheme(theme) {
            const html = document.documentElement;

            if (theme === 'dark') {
                html.setAttribute('data-theme', 'dark');
            } else {
                html.removeAttribute('data-theme');
            }

            // Save preference
            localStorage.setItem('kaster_theme', theme);

            // Update button
            updateThemeToggleButton();

            console.log(`Theme changed to: ${theme}`);
        }

        function toggleTheme() {
            const currentTheme = getCurrentTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        }

        function getCurrentTheme() {
            return document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
        }

        function updateThemeToggleButton() {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                const currentTheme = getCurrentTheme();

                if (currentTheme === 'dark') {
                    themeToggle.innerHTML = '☀️';
                    themeToggle.title = window.i18n.t('theme.toggle_light');
                } else {
                    themeToggle.innerHTML = '🌙';
                    themeToggle.title = window.i18n.t('theme.toggle_dark');
                }
            }
        }

        // =================================================================
        // --- common.js (Wallet connection logic, already corrected) ---
        // =================================================================
        function initializeSharedUI(state) {
            // Initialize i18n system first
            window.i18n.init();
            // Initialize theme first
            initializeTheme();
            updateWalletUI(state);
            setupCommonEventListeners(state);
            populateLanguageDropdown();
            checkKaswarePresence();

            // Check if it's the first visit and show modal if necessary
            if (!hasUserAcceptedFirstVisit()) {
                showFirstVisitModal();
            }
        }

        function setupCommonEventListeners(state) {
            document.getElementById('connect-wallet-btn').addEventListener('click', () => connectWallet(state));

            // Filter management button
            const manageFiltersBtn = document.getElementById('manage-filters-btn');
            if (manageFiltersBtn) {
                manageFiltersBtn.addEventListener('click', () => {
                    if (window.openTermsManagementModal) {
                        window.openTermsManagementModal();
                    }
                });
            }

            // Legal consent modal management
            setupLegalConsentModal();

            // First visit/demo modal management
            setupFirstVisitModal();
            const modal = document.getElementById('newThreadModal');
            const openButtons = [document.getElementById('create-thread-btn'), document.getElementById('create-thread-btn-floating')];
            const closeButton = document.querySelector('.modal .close');
            const cancelButton = document.getElementById('cancel-thread-btn');

            openButtons.forEach(btn => btn?.addEventListener('click', () => {
                if(state.isConnected) {
                    modal.classList.add('d-block');
                } else {
                    showStatus("status.connect_wallet_required", "error");
                }
            }));

            const closeModal = () => {
                modal.classList.remove('d-block');
                // Reset form when closing
                document.getElementById('new-thread-form').reset();
            };

            closeButton?.addEventListener('click', closeModal);
            cancelButton?.addEventListener('click', closeModal);
            window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });

            // Filtered terms modal management
            setupTermsManagementModal();

            const refreshButtons = [document.getElementById('refresh-btn'), document.getElementById('refresh-btn-floating')];
            refreshButtons.forEach(btn => btn?.addEventListener('click', () => handleRefreshClick(state)));

            // No longer need to handle click on a link in reply-warning as it's now plain text
            // User can click directly on the "Connect Wallet" button at the top
        }

        async function connectWallet(state) {
            if (typeof window.kasware === 'undefined') {
                showStatus("status.kasware_not_installed", "error"); return;
            }

            // Check if the user has already consented
            if (!hasUserConsented()) {
                showLegalConsentModal();
                return;
            }

            try {
                const accounts = await window.kasware.requestAccounts();
                if (accounts && accounts.length > 0) {
                    state.isConnected = true;
                    state.userAddress = accounts[0];

                    // Save connection state in localStorage
                    localStorage.setItem('kaster_wallet_connected', 'true');
                    localStorage.setItem('kaster_wallet_address', accounts[0]);

                    updateWalletUI(state);
                    showStatus("status.wallet_connected", "success");
                } else { throw new Error(window.i18n ? window.i18n.t("error.no_account_returned") : "No account returned."); }
            } catch (error) {
                console.error("Wallet connection error:", error);

                // Clean localStorage in case of error
                localStorage.removeItem('kaster_wallet_connected');
                localStorage.removeItem('kaster_wallet_address');

                showStatus("status.wallet_connection_refused", "error");
            }
        }

        // === Legal consent modal management ===
        function setupLegalConsentModal() {
            const modal = document.getElementById('legalConsentModal');
            const checkbox = document.getElementById('legalConsentCheckbox');
            const acceptButton = document.getElementById('acceptLegalConsent');
            const languageSelect = document.getElementById('legalLanguageSelect');

            // Handle language change in the modal
            languageSelect?.addEventListener('change', (e) => {
                const selectedLang = e.target.value;

                // Temporarily change language for the modal
                const originalLang = window.i18n.currentLang;
                window.i18n.currentLang = selectedLang;

                // Update only modal elements
                updateLegalModalTranslations();

                // Restore original language (modal has its own language)
                window.i18n.currentLang = originalLang;
            });

            // Enable/disable button based on checkbox
            checkbox?.addEventListener('change', () => {
                if (acceptButton) {
                    acceptButton.disabled = !checkbox.checked;
                    acceptButton.classList.toggle('button-disabled', !checkbox.checked);
                    acceptButton.classList.toggle('button-enabled', checkbox.checked);
                }
            });

            // Handle acceptance
            acceptButton?.addEventListener('click', () => {
                if (checkbox?.checked) {
                    // Save consent with chosen language
                    const selectedLang = languageSelect?.value || 'en';
                    localStorage.setItem('kaster_legal_consent', 'true');
                    localStorage.setItem('kaster_legal_consent_date', new Date().toISOString());
                    localStorage.setItem('kaster_legal_consent_language', selectedLang);

                    // Close modal
                    modal.classList.add('modal-hidden');
                    modal.classList.remove('modal-visible');
                    modal.classList.add('d-none'); // FIX: Ensure modal is completely hidden
                    document.body.classList.remove('body-no-scroll');

                    // Proceed with connection
                    const state = window.currentState || { isConnected: false, userAddress: '' };
                    connectWallet(state);
                }
            });

            // Handle refusal
            const refuseButton = document.getElementById('refuseLegalConsent');
            refuseButton?.addEventListener('click', () => {
                // Simply close modal without storing anything
                modal.classList.add('modal-hidden');
                modal.classList.remove('modal-visible');
                modal.classList.add('d-none'); // FIX: Ensure modal is completely hidden
                document.body.classList.remove('body-no-scroll');

                // Display informative message
                showStatus(window.i18n ? window.i18n.t('status.legal_consent_refused') || 'Consent refused. You can try again later by clicking Connect Wallet.' : 'Consent refused. You can try again later by clicking Connect Wallet.', 'error', 5000);

                console.log('❌ Legal consent refused - user can try again anytime');
            });

            // Prevent modal from closing when clicking outside
            modal?.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Prevent closing when clicking on content
            const modalContent = modal?.querySelector('.modal-content');
            modalContent?.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        function updateLegalModalTranslations() {
            const modal = document.getElementById('legalConsentModal');
            if (!modal) return;

            // Update all elements with data-i18n in the modal
            modal.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.dataset.i18n;
                const translated = window.i18n.t(key);

                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translated;
                } else if (element.tagName === 'BUTTON') {
                    element.textContent = translated;
                } else {
                    // For elements containing HTML/text - avoid innerHTML for CSP
                    element.textContent = translated;
                }
            });
        }

        function hasUserConsented() {
            return localStorage.getItem('kaster_legal_consent') === 'true';
        }

        function showLegalConsentModal() {
            const modal = document.getElementById('legalConsentModal');
            if (modal) {
                // Initialize modal with current interface language
                const languageSelect = document.getElementById('legalLanguageSelect');
                if (languageSelect) {
                    languageSelect.value = window.i18n.currentLang;
                }

                // Display in current interface language
                updateLegalModalTranslations();

                modal.classList.remove('modal-hidden');
                modal.classList.remove('d-none'); // Ensure d-none is removed
                modal.classList.add('modal-visible', 'modal-fullscreen');

                // Ensure checkbox is unchecked
                const checkbox = document.getElementById('legalConsentCheckbox');
                const acceptButton = document.getElementById('acceptLegalConsent');

                if (checkbox) {
                    checkbox.checked = false;
                }

                if (acceptButton) {
                    acceptButton.disabled = true;
                    acceptButton.classList.add('button-disabled');
                    acceptButton.classList.remove('button-enabled');
                }

                // Make modal visible on mobile by adjusting viewport
                document.body.classList.add('body-no-scroll');
            }
        }

        // === First visit / demo modal management ===
        function setupFirstVisitModal() {
            const modal = document.getElementById('firstVisitModal');
            const checkbox = document.getElementById('demoAgeCheckbox');
            const acceptButton = document.getElementById('acceptDemoAccess');
            const refuseButton = document.getElementById('refuseDemoAccess');
            const languageSelect = document.getElementById('demoLanguageSelect');

            // Handle language change in the modal
            languageSelect?.addEventListener('change', (e) => {
                const selectedLang = e.target.value;

                // Temporarily change language for the modal
                const originalLang = window.i18n.currentLang;
                window.i18n.currentLang = selectedLang;

                // Update only modal elements
                updateFirstVisitModalTranslations();

                // Restore original language
                window.i18n.currentLang = originalLang;
            });

            // Enable/disable button based on checkbox
            checkbox?.addEventListener('change', () => {
                if (acceptButton) {
                    acceptButton.disabled = !checkbox.checked;
                    acceptButton.classList.toggle('button-disabled', !checkbox.checked);
                    acceptButton.classList.toggle('button-enabled', checkbox.checked);
                }
            });

            // Handle acceptance
            acceptButton?.addEventListener('click', () => {
                if (checkbox?.checked) {
                    // Save acceptance with chosen language
                    const selectedLang = languageSelect?.value || 'en';
                    localStorage.setItem('kaster_first_visit_accepted', 'true');
                    localStorage.setItem('kaster_first_visit_date', new Date().toISOString());
                    localStorage.setItem('kaster_first_visit_language', selectedLang);

                    // Close modal
                    modal.classList.add('modal-hidden');
                    modal.classList.remove('modal-visible');
                    modal.classList.add('d-none'); // FIX: Ensure modal is completely hidden

                    console.log('✅ First visit accepted, user can continue');
                }
            });

            // Handle refusal
            refuseButton?.addEventListener('click', () => {
                if (confirm(window.i18n ? window.i18n.t('confirm.exit_application') || 'Do you really want to exit the application?' : 'Do you really want to exit the application?')) {
                    // Ensure modal is hidden before potentially closing window or redirecting
                    modal.classList.add('modal-hidden');
                    modal.classList.remove('modal-visible');
                    modal.classList.add('d-none'); // FIX: Ensure modal is completely hidden

                    // Try to close the tab intelligently
                    if (window.opener || window.history.length === 1) {
                        window.close();
                    }

                    // Elegant fallback to the official Kaspa website
                    setTimeout(() => {
                        window.location.href = 'https://kaspa.org';
                    }, 100);
                }
            });

            // Prevent modal from closing when clicking outside
            modal?.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Prevent closing when clicking on content
            const modalContent = modal?.querySelector('.modal-content');
            modalContent?.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        function updateFirstVisitModalTranslations() {
            const modal = document.getElementById('firstVisitModal');
            if (!modal) return;

            // Update all elements with data-i18n in the modal
            modal.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.dataset.i18n;
                const translated = window.i18n.t(key);

                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translated;
                } else if (element.tagName === 'BUTTON') {
                    element.textContent = translated;
                } else {
                    // For elements containing HTML/text - avoid innerHTML for CSP
                    element.textContent = translated;
                }
            });
        }

        function hasUserAcceptedFirstVisit() {
            return localStorage.getItem('kaster_first_visit_accepted') === 'true';
        }

        function showFirstVisitModal() {
            const modal = document.getElementById('firstVisitModal');
            if (modal) {
                // Initialize modal with current interface language
                const languageSelect = document.getElementById('demoLanguageSelect');
                if (languageSelect) {
                    languageSelect.value = window.i18n.currentLang;
                }

                // Display in current interface language
                updateFirstVisitModalTranslations();

                modal.classList.remove('modal-hidden');
                modal.classList.remove('d-none'); // Ensure d-none is removed
                modal.classList.add('modal-visible', 'modal-fullscreen');

                // Ensure checkbox is unchecked
                const checkbox = document.getElementById('demoAgeCheckbox');
                const acceptButton = document.getElementById('acceptDemoAccess');

                if (checkbox) {
                    checkbox.checked = false;
                }

                if (acceptButton) {
                    acceptButton.disabled = true;
                    acceptButton.classList.add('button-disabled');
                    acceptButton.classList.remove('button-enabled');
                }

                // Make modal visible on mobile
                document.body.classList.add('body-no-scroll');

                console.log('📢 First visit modal displayed - age verification required');
            }
        }

        async function tryRestoreWalletConnection() {
            const result = { isConnected: false, userAddress: '' };

            // Wait for Kasware to be available (extensions can take time)
            let kaswareAvailable = typeof window.kasware !== 'undefined';

            if (!kaswareAvailable) {
                console.log('⏳ Waiting for Kasware injection...');

                // Wait up to 3 seconds for Kasware to be injected
                kaswareAvailable = await new Promise((resolve) => {
                    let attempts = 0;
                    const maxAttempts = 30; // 3 seconds (30 x 100ms)

                    const checkInterval = setInterval(() => {
                        attempts++;

                        if (typeof window.kasware !== 'undefined') {
                            console.log(`✅ Kasware detected after ${attempts * 100}ms for connection`);
                            clearInterval(checkInterval);
                            resolve(true);
                        } else if (attempts >= maxAttempts) {
                            console.log('❌ Kasware not available after 3 seconds');
                            clearInterval(checkInterval);
                            resolve(false);
                        }
                    }, 100);
                });
            }

            if (!kaswareAvailable) {
                console.log('Kasware not available for connection restoration');
                return result;
            }

            // First check localStorage to see if we were connected
            const wasConnected = localStorage.getItem('kaster_wallet_connected') === 'true';
            const savedAddress = localStorage.getItem('kaster_wallet_address');

            console.log('Checking wallet connection - localStorage:', { wasConnected, savedAddress: savedAddress ? savedAddress.substring(0, 10) + '...' : null });

            try {
                // According to Kasware docs: "getAccounts() is also used to certify if the user is connected, which should be called first."
                const accounts = await window.kasware.getAccounts();
                console.log('getAccounts() result:', accounts);

                if (accounts && accounts.length > 0) {
                    // User is connected in Kasware
                    result.isConnected = true;
                    result.userAddress = accounts[0];

                    // Save to localStorage for consistency
                    localStorage.setItem('kaster_wallet_connected', 'true');
                    localStorage.setItem('kaster_wallet_address', accounts[0]);

                    console.log('✅ Wallet connection detected via getAccounts():', accounts[0]);
                } else if (wasConnected && savedAddress) {
                    // getAccounts() returned nothing but we were connected before
                    // Temporarily trust localStorage
                    result.isConnected = true;
                    result.userAddress = savedAddress;

                    console.log('⚠️ getAccounts() empty but localStorage indicates connection, using savedAddress:', savedAddress);

                    // Background check to clean up if necessary
                    setTimeout(async () => {
                        try {
                            const recheckAccounts = await window.kasware.getAccounts();
                            if (!recheckAccounts || recheckAccounts.length === 0) {
                                console.log('🧹 Background check: wallet disconnected, cleaning localStorage');
                                localStorage.removeItem('kaster_wallet_connected');
                                localStorage.removeItem('kaster_wallet_address');
                                // Optional: reload page to update UI
                                // window.location.reload();
                            }
                        } catch (error) {
                            console.log('Background check error:', error);
                        }
                    }, 2000);
                } else {
                    // User is not connected
                    localStorage.removeItem('kaster_wallet_connected');
                    localStorage.removeItem('kaster_wallet_address');

                    console.log('❌ No wallet connection detected');
                }
            } catch (error) {
                // Error during check
                console.log('❌ Error checking wallet connection:', error);

                if (wasConnected && savedAddress) {
                    // In case of error but with valid localStorage, trust localStorage
                    result.isConnected = true;
                    result.userAddress = savedAddress;
                    console.log('⚠️ getAccounts() error but localStorage valid, using savedAddress:', savedAddress);
                } else {
                    // Clean localStorage if error and no valid save
                    localStorage.removeItem('kaster_wallet_connected');
                    localStorage.removeItem('kaster_wallet_address');
                }
            }

            console.log('Final result of tryRestoreWalletConnection:', result);
            return result;
        }

        async function updateWalletUI(state) {
            const connectBtn = document.getElementById('connect-wallet-btn');
            const walletInfo = document.getElementById('wallet-info');
            const walletAddressEl = document.getElementById('wallet-address');
            const walletBalanceEl = document.getElementById('wallet-balance');

            if (state.isConnected) {
                connectBtn.classList.add('d-none');
                walletInfo.classList.remove('d-none');
                walletInfo.classList.add('d-flex');

                const cleanAddress = state.userAddress.replace(/^kaspa:/, '');
                walletAddressEl.textContent = truncateAddress(cleanAddress, 6, 4);
                walletAddressEl.title = `${state.userAddress} - Click to disconnect`;
                walletAddressEl.classList.add('wallet-address-btn');

                const newAddressEl = walletAddressEl.cloneNode(true);
                walletAddressEl.parentNode.replaceChild(newAddressEl, walletAddressEl);
                newAddressEl.addEventListener('click', () => disconnectWallet(state));

                try {
                    const balance = await window.kasware.getBalance();
                    walletBalanceEl.textContent = `${window.i18n ? window.i18n.t('meta.balance') : 'Balance:'} ${(balance.total / 1e8).toFixed(3)} KAS`;
                } catch (e) {
                    walletBalanceEl.textContent = window.i18n ? window.i18n.t('meta.balance_unavailable') : 'Balance unavailable';
                }
            } else {
                connectBtn.classList.remove('d-none');
                walletInfo.classList.add('d-none');
                walletInfo.classList.remove('d-flex');
            }

            // If on thread page, update reply form
            const pageThread = document.getElementById('page-thread');
            if (pageThread && !pageThread.classList.contains('d-none')) {
                updateReplyFormState(state);
            }
        }

        function disconnectWallet(state) {
            if (confirm(window.i18n ? window.i18n.t('confirm.disconnect_wallet') : 'Do you really want to disconnect?')) {
                // Clear local state
                state.isConnected = false;
                state.userAddress = '';

                // Clear localStorage
                localStorage.removeItem('kaster_wallet_connected');
                localStorage.removeItem('kaster_wallet_address');

                // Update UI
                updateWalletUI(state);

                // Optional: disconnect from Kasware (if API allows)
                try {
                    if (typeof window.kasware !== 'undefined' && window.kasware.disconnect) {
                        window.kasware.disconnect(window.location.origin);
                    }
                } catch (error) {
                    console.log('Error during Kasware disconnection:', error);
                }

                showStatus('status.wallet_disconnected', 'success');
                console.log('✅ Wallet disconnected');
            }
        }

        function checkKaswarePresence() {
            const banner = document.getElementById('kasware-not-detected-banner');
            if (typeof window.kasware !== 'undefined') {
                console.log('✅ Kasware detected immediately');
                return;
            }

            console.log('⏳ Kasware not detected, waiting for injection...');
            let attempts = 0;
            const maxAttempts = 50;

            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.kasware !== 'undefined') {
                    console.log(`✅ Kasware detected after ${attempts * 100}ms`);
                    clearInterval(checkInterval);
                    banner.classList.add('d-none');
                } else if (attempts >= maxAttempts) {
                    console.log('❌ Kasware not detected after 5 seconds, displaying banner');
                    clearInterval(checkInterval);
                    banner.classList.remove('d-none');
                }
            }, 100);
        }

        function showStatus(message, type = 'success', duration = 3000) {
            const statusBar = document.getElementById('status-bar');
            // Translate message if it's a translation key
            const translatedMessage = message.includes('.') && window.i18n ? window.i18n.t(message) : message;
            statusBar.textContent = translatedMessage;
            statusBar.className = `show ${type}`;
            setTimeout(() => { statusBar.className = statusBar.className.replace('show', ''); }, duration);
        }

        function truncateAddress(address, start = 6, end = 4) { if (!address) return ''; return `${address.substring(0, start)}...${address.substring(address.length - end)}`; }
        const languages = { "fr": "Français", "en": "English", "es": "Español", "de": "Deutsch", "it": "Italiano", "pt": "Português", "ru": "Русский", "zh": "中文", "ja": "日本語", "ko": "한국어" };
        function populateLanguageDropdown() {
            const select = document.getElementById('thread-language-input'); if(!select) return;
            Object.entries(languages).forEach(([code, name]) => {
                const option = document.createElement('option');
                option.value = code; option.textContent = name;
                if (code === 'fr') option.selected = true;
                select.appendChild(option);
            });
        }

        // =================================================================
        // --- Filtered Terms Management (Interface) ---
        // =================================================================
        function setupTermsManagementModal() {
            const modal = document.getElementById('termsManagementModal');
            const addBtn = document.getElementById('add-filtered-term-btn');
            const closeBtn = document.getElementById('close-terms-modal-btn');
            const termInput = document.getElementById('new-filtered-term');
            const termsList = document.getElementById('filtered-terms-list');
            const termsStats = document.getElementById('terms-stats');

            // Ultra-simplified function to create a term element (without language)
            function createTermElement(termData) {
                const termDiv = document.createElement('div');
                termDiv.className = 'term-element';

                const termInfo = document.createElement('div');
                termInfo.className = 'term-info';

                const termText = document.createElement('strong');
                termText.className = 'term-text';
                termText.textContent = `"${termData.term}"`;

                termInfo.appendChild(termText);

                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '🗑️';
                removeBtn.title = 'Delete this term';
                removeBtn.className = 'term-remove-btn';

                removeBtn.addEventListener('click', async () => {
                    if (confirm(window.i18n.t('confirm.delete_term', { term: termData.term }))) {
                        try {
                            await window.kasterDB.removeFilteredTerm(termData.id);
                            showStatus(window.i18n.t('filters.term_removed', { term: termData.term }), 'success');
                            await window.refreshFilteredTermsList();
                        } catch (error) {
                            console.error('Error deleting term:', error);
                            showStatus('filters.remove_term_error', 'error');
                        }
                    }
                });

                termDiv.append(termInfo, removeBtn);
                return termDiv;
            }

            // Fully simplified function to refresh the list of terms
            window.refreshFilteredTermsList = async () => {
                try {
                    termsList.innerHTML = `<div class="loading-spinner"></div><p>${window.i18n.t('misc.loading')}</p>`;

                    const allTerms = await window.kasterDB.getFilteredTerms();

                    // Calculate simplified statistics
                    const totalCount = allTerms.length;

                    // Update ultra-simplified statistics
                    if (termsStats) {
                        // Create DOM elements to avoid CSP violations
                        const statsContainer = document.createElement('div');
                        statsContainer.className = 'terms-stats-display';

                        const statsText = document.createElement('span');
                        statsText.className = 'terms-total-text';
                        const strongElement = document.createElement('strong');
                        strongElement.textContent = 'Total:';
                        statsText.appendChild(strongElement);
                        statsText.appendChild(document.createTextNode(` ${totalCount} term${totalCount > 1 ? 's' : ''}`));

                        statsContainer.appendChild(statsText);
                        termsStats.innerHTML = '';
                        termsStats.appendChild(statsContainer);
                    }

                    if (allTerms.length === 0) {
                        const noTermsMessage = document.createElement('p');
                        noTermsMessage.className = 'terms-no-items';
                        noTermsMessage.textContent = window.i18n ? window.i18n.t('filters.no_terms') : 'No filtered terms yet';

                        termsList.innerHTML = '';
                        termsList.appendChild(noTermsMessage);
                        return;
                    }

                    // Sort terms alphabetically only
                    allTerms.sort((a, b) => a.term.localeCompare(b.term));

                    // Simple display without grouping by language
                    termsList.innerHTML = '';

                    // A single simple header
                    const simpleHeader = document.createElement('div');
                    simpleHeader.className = 'terms-section-header french'; // Uses existing class

                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'title';
                    titleSpan.textContent = window.i18n.t('filters.filtered_terms_title');

                    simpleHeader.appendChild(titleSpan);
                    termsList.appendChild(simpleHeader);

                    // Display all terms directly
                    allTerms.forEach(termData => {
                        termsList.appendChild(createTermElement(termData));
                    });
                } catch (error) {
                    console.error('Error loading terms:', error);
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'terms-error';
                    errorMsg.textContent = window.i18n.t('filters.load_terms_error');
                    termsList.innerHTML = '';
                    termsList.appendChild(errorMsg);
                }
            };

            // Event listeners for the modal
            if (addBtn) {
                addBtn.addEventListener('click', async () => {
                    const term = termInput.value.trim().toLowerCase();
                    const language = 'fr'; // Default to French, no more selector

                    if (!term) {
                        showStatus('filters.enter_term', 'error');
                        return;
                    }
                    if (term.length < 2) {
                        showStatus('error.term_too_short', 'error');
                        return;
                    }

                    // Check for duplicates in both languages
                    try {
                        const existingTerms = await window.kasterDB.getFilteredTerms();
                        const isDuplicate = existingTerms.some(existing =>
                            existing.term === term
                        );

                        if (isDuplicate) {
                            showStatus(window.i18n.t('error.term_exists', { term: term }), 'error');
                            return;
                        }

                        await window.kasterDB.addFilteredTerm(term, language);
                        showStatus(window.i18n.t('filters.term_added', { term: term }), 'success');

                        // Reset form
                        termInput.value = '';
                        termInput.focus();

                        // Refresh list
                        await window.refreshFilteredTermsList();

                    } catch (error) {
                        console.error('Error adding term:', error);
                        showStatus('filters.add_term_error', 'error');
                    }
                });
            }

            // Allow adding by pressing Enter
            if (termInput) {
                termInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (addBtn) {
                            addBtn.click();
                        }
                    }
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('d-block');
                    modal.classList.add('d-none');
                });
            }

            // Also handle the close cross (×)
            const closeXBtn = modal?.querySelector('.close');
            if (closeXBtn) {
                closeXBtn.addEventListener('click', () => {
                    modal.classList.remove('d-block');
                    modal.classList.add('d-none');
                });
            }

            // No more event listeners for filters - completely simplified system

            // Close modal by clicking outside
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('d-block');
                    modal.classList.add('d-none');
                }
            });

            // Close with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('d-none')) {
                    modal.classList.remove('d-block');
                    modal.classList.add('d-none');
                }
            });
        }

        // Global function to open the terms management modal
        window.openTermsManagementModal = async function() {
            const modal = document.getElementById('termsManagementModal');
            if (modal) {
                modal.classList.remove('d-none');
                modal.classList.add('d-block');

                // Load terms list on first display
                if (window.refreshFilteredTermsList) {
                    await window.refreshFilteredTermsList();
                }
            }
        };

        // =================================================================
        // --- script.js (Index Logic - Adapted to new API) ---
        // =================================================================

        function truncateTitle(title, maxLength = 40) {
            if (!title) return title;
            return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
        }

        function ensureFloatingButtonsVisibleOnMobile() {
            // Check if on mobile (screen width <= 768px)
            if (window.innerWidth <= 768) {
                const createBtn = document.getElementById('create-thread-btn-floating');
                const refreshBtn = document.getElementById('refresh-btn-floating');

                if (createBtn) {
                    createBtn.classList.remove('d-none');
                }

                if (refreshBtn) {
                    refreshBtn.classList.remove('d-none');
                }
            }
        }

        async function initializeIndexPage() {
            const state = {
                isConnected: false,
                userAddress: '',
                allThreads: [],
                themes: new Set(),
                languages: new Set(),
                isCheckingReplies: false,
                currentPage: 1,
                threadsPerPage: 20,
                currentPageThreads: []
            };

            // Store state globally for pagination
            window.currentState = state;
            try {
                await window.kasterDB.init();
                const walletState = await tryRestoreWalletConnection();
                Object.assign(state, walletState);
                initializeSharedUI(state);
                attachIndexEventListeners(state);

                // Ensure floating buttons are visible on mobile (home page)
                ensureFloatingButtonsVisibleOnMobile();

                await loadAndDisplayThreads(state);

                // Second check with delay to ensure buttons remain visible
                setTimeout(() => {
                    ensureFloatingButtonsVisibleOnMobile();
                }, 2000);
            } catch (error) {
                console.error("Initialization error:", error);
                showStatus("error.init_error", 'error', 10000);
            }
        }

        function attachIndexEventListeners(state) {
            document.getElementById('new-thread-form').addEventListener('submit', (e) => handleThreadSubmit(e, state));
            document.getElementById('thread-title-input').addEventListener('input', () => updateCharCounter('thread-title-input', 'title-char-counter', MAX_TITLE_BYTES));
            document.getElementById('thread-message-input').addEventListener('input', () => updateCharCounter('thread-message-input', 'message-char-counter', MAX_MESSAGE_BYTES));

            // Event listeners for filters with localStorage saving
            ['theme-filter', 'language-filter', 'sort-filter'].forEach(id => {
                document.getElementById(id).addEventListener('change', async (e) => {
                    // Reset to page 1 when filters change
                    state.currentPage = 1;
                    // Save preference in localStorage
                    localStorage.setItem(`kaster_filter_${id}`, e.target.value);
                    await renderThreads(state);
                });
            });

            // Add pagination event listeners
            attachPaginationEventListeners(state);

            // Restore filter preferences from localStorage
            restoreFilterPreferences();
        }

        function restoreFilterPreferences() {
            const filterIds = ['theme-filter', 'language-filter', 'sort-filter'];
            filterIds.forEach(id => {
                const savedValue = localStorage.getItem(`kaster_filter_${id}`);
                const element = document.getElementById(id);
                if (savedValue && element) {
                    // Check if the option still exists before selecting it
                    const option = element.querySelector(`option[value="${savedValue}"]`);
                    if (option) {
                        element.value = savedValue;
                    }
                }
            });
        }

        async function loadAndDisplayThreads(state) {
            const threadList = document.getElementById('thread-list');
            threadList.innerHTML = `<div class="loading-message"><div class="loading-spinner"></div><p>${window.i18n ? window.i18n.t('index.loading') : 'Loading discussions...'}</p></div>`;

            // Removed: Mandatory KasWare check before accessing discussions
            // Threads will now attempt to load regardless of KasWare presence.
            // Functionalities requiring KasWare (like sending messages) will still be disabled/warned.

            try {
                const threads = await window.kasterAPI.fetchThreads();
                const hiddenMessages = await window.kasterDB.getHiddenMessages();
                const blacklistedWallets = await window.kasterDB.getBlacklistedWallets();

                // Filter threads with unwanted terms
                const filteredThreads = [];
                for (const thread of threads) {
                    // Basic checks
                    if (!thread.sender_address ||
                        hiddenMessages.includes(thread.txid) ||
                        blacklistedWallets.includes(thread.sender_address)) {
                        continue;
                    }

                    // Check for illegal terms in title and message
                    const titleCheck = await window.kasterDB.containsFilteredTerms(thread.title || '');
                    const messageCheck = await window.kasterDB.containsFilteredTerms(thread.message || '');

                    if (titleCheck.hasFilteredTerm || messageCheck.hasFilteredTerm) {
                        console.log(`🚫 Thread filtered for unwanted terms: ${thread.txid}`, [
                            ...titleCheck.matchedTerms,
                            ...messageCheck.matchedTerms
                        ]);
                        continue;
                    }

                    filteredThreads.push(thread);
                }

                state.allThreads = filteredThreads;
                updateFilters(state);
                await renderThreads(state);
            } catch (error) {
                console.error("Error loading threads:", error);
                // Modified error message to reflect that Kasware is not the only reason for failure
                threadList.innerHTML = `<div class="notice-box error">${window.i18n ? window.i18n.t('index.error') : 'Could not load discussions. The Kaspa API may be temporarily unavailable or an error occurred.'}</div>`;
            }
        }

        function updateFilters(state) {
            state.themes.clear(); state.languages.clear();
            state.allThreads.forEach(thread => {
                if (thread.theme) state.themes.add(thread.theme);
                if (thread.language) state.languages.add(thread.language);
            });
            const themeFilter = document.getElementById('theme-filter'), langFilter = document.getElementById('language-filter');
            themeFilter.innerHTML = `<option value="all" data-i18n="index.filters.all_themes">${window.i18n ? window.i18n.t('index.filters.all_themes') : 'All themes'}</option>`;
            langFilter.innerHTML = `<option value="all" data-i18n="index.filters.all_languages">${window.i18n ? window.i18n.t('index.filters.all_languages') : 'All languages'}</option>`;

            // Convert Set to Array and sort to avoid duplicates and maintain consistent order
            const sortedThemes = Array.from(state.themes).sort();

            sortedThemes.forEach(theme => themeFilter.add(new Option(theme, theme)));

            // Use all available languages from the modal, not just those in threads
            Object.entries(languages).forEach(([code, name]) => {
                langFilter.add(new Option(name, code));
            });

            // Update translations after creating dynamic filters
            if (window.i18n) {
                window.i18n.updateAllTexts();
            }

            // Restore filter preferences after updating options
            restoreFilterPreferences();
        }

        async function renderThreads(state) {
            const threadList = document.getElementById('thread-list');
            const theme = document.getElementById('theme-filter').value, language = document.getElementById('language-filter').value, sort = document.getElementById('sort-filter').value;
            let filteredThreads = state.allThreads;
            if (theme !== 'all') filteredThreads = filteredThreads.filter(t => t.theme === theme);
            if (language !== 'all') filteredThreads = filteredThreads.filter(t => t.language === language);
            if (sort === 'priority') filteredThreads.sort((a, b) => b.priority - a.priority || new Date(b.block_time) - new Date(a.block_time));
            else filteredThreads.sort((a, b) => new Date(b.block_time) - new Date(a.block_time));

            const totalThreads = filteredThreads.length;
            const totalPages = Math.ceil(totalThreads / state.threadsPerPage);
            const startIndex = (state.currentPage - 1) * state.threadsPerPage;
            const endIndex = startIndex + state.threadsPerPage;
            const currentPageThreads = filteredThreads.slice(startIndex, endIndex);

            state.currentPageThreads = currentPageThreads;

            document.getElementById('threads-count').textContent = `${totalThreads} ${window.i18n ? window.i18n.t('index.threads_count') : 'discussion(s)'}`;

            if (totalThreads === 0) {
                threadList.innerHTML = `<div class="notice-box">${window.i18n ? window.i18n.t('index.no_threads') : 'No discussions match your criteria.'}</div>`;
                document.getElementById('pagination-container').classList.add('d-none'); // MODIFIED
                return;
            }

            document.getElementById('pagination-container').classList.remove('d-none'); // MODIFIED

            const threadCountsMap = new Map();
            const archivedThreadIds = await window.kasterDB.getArchivedThreads();

            for (const thread of currentPageThreads) {
                try {
                    const cachedCount = await window.kasterDB.getCachedReplyCount(thread.txid);
                    if (cachedCount) {
                        threadCountsMap.set(thread.txid, cachedCount.replyCount);
                    }
                } catch (e) {}

                // Mark as archived only if already marked in DB
                const isPermanentlyArchived = archivedThreadIds.includes(thread.txid);
                if (isPermanentlyArchived) {
                    thread.archived = true;
                }
            }

            // FIX: Using DOM element creation to prevent XSS vulnerabilities
            threadList.innerHTML = ''; // Clear list
            currentPageThreads.forEach(thread => {
                const cachedReplyCount = threadCountsMap.get(thread.txid) || 0;

                const threadLink = document.createElement('a');
                threadLink.href = `?txid=${thread.txid}`;
                threadLink.className = `thread-item${thread.archived ? ' archived' : ''}`;
                threadLink.dataset.txid = thread.txid;

                const titleElement = document.createElement('h2');
                titleElement.className = 'thread-title';
                const displayTitle = truncateTitle(thread.title) || (window.i18n ? window.i18n.t('misc.untitled') : 'Untitled');
                titleElement.textContent = displayTitle;
                titleElement.title = thread.title; // Show full title on hover

                const metaContainer = document.createElement('div');
                metaContainer.className = 'thread-meta';

                const dateSpan = document.createElement('span');
                const dateStrong = document.createElement('strong');
                dateStrong.textContent = new Date(thread.block_time).toLocaleString(window.i18n?.currentLang === 'en' ? 'en-US' : 'fr-FR');
                dateSpan.appendChild(dateStrong);

                const authorSpan = document.createElement('span');
                const authorStrong = document.createElement('strong');
                authorStrong.textContent = truncateAddress(thread.sender_address.replace(/^kaspa:/, ''), 6, 4);
                authorSpan.textContent = `${window.i18n ? window.i18n.t('meta.by') : 'By:'} `;
                authorSpan.appendChild(authorStrong);

                const replyCountSpan = document.createElement('span');
                replyCountSpan.className = 'thread-reply-count';
                replyCountSpan.dataset.txid = thread.txid;
                const replyCountNumber = document.createElement('span');
                replyCountNumber.className = 'reply-count-number';
                replyCountNumber.textContent = cachedReplyCount;
                replyCountSpan.innerHTML = `💬 `; // Safe to use innerHTML for an emoji
                replyCountSpan.appendChild(replyCountNumber);
                replyCountSpan.append(` ${window.i18n ? (window.i18n.currentLang === 'en' ? (cachedReplyCount === 1 ? 'reply' : 'replies') : 'réponse(s)') : 'réponse(s)'}`);

                const newRepliesContainer = document.createElement('span');
                newRepliesContainer.className = 'new-replies-container';
                newRepliesContainer.dataset.txid = thread.txid;
                newRepliesContainer.classList.add('d-none');

                metaContainer.append(dateSpan, authorSpan, replyCountSpan);

                if (thread.archived) {
                    const archivedBadge = document.createElement('span');
                    archivedBadge.className = 'archived-badge';
                    archivedBadge.textContent = window.i18n ? window.i18n.t('meta.archived') : 'Archived';
                    metaContainer.appendChild(archivedBadge);
                }

                metaContainer.appendChild(newRepliesContainer);
                threadLink.append(titleElement, metaContainer);
                threadList.appendChild(threadLink);
            });

            renderPagination(state, totalPages);

           if (window.i18n) {
               window.i18n.updateAllTexts();
           }

           // Ensure floating buttons are visible on mobile after render
           setTimeout(() => {
               ensureFloatingButtonsVisibleOnMobile();
               startUnifiedBackgroundCheck(state);
           }, 1000);
        }


        function renderPagination(state, totalPages) {
            const paginationContainer = document.getElementById('pagination-container');
            if (totalPages <= 1) {
                paginationContainer.classList.add('d-none');
                return;
            } else {
                paginationContainer.classList.remove('d-none');
            }

            const numbersContainer = document.getElementById('pagination-numbers');
            numbersContainer.innerHTML = ''; // Clear container

            const createPageButton = (page) => {
                const button = document.createElement('button');
                const isActive = page === state.currentPage;
                button.className = isActive ? 'button-primary' : 'button-secondary';
                button.textContent = page;
                if (isActive) {
                    button.disabled = true;
                } else {
                    button.addEventListener('click', () => window.goToPage(page));
                }
                return button;
            };

            const createSpacer = () => {
                const spacer = document.createElement('span');
                spacer.className = 'pagination-spacer';
                spacer.textContent = '...';
                return spacer;
            };

            // Smart system limited to a maximum of 4 pages
            if (totalPages <= 4) {
                // If 4 pages or less, display all
                for (let i = 1; i <= totalPages; i++) {
                    numbersContainer.appendChild(createPageButton(i));
                }
            } else {
                // More than 4 pages: smart logic
                if (state.currentPage <= 2) {
                    // At the beginning: 1, 2, 3, ..., last
                    numbersContainer.appendChild(createPageButton(1));
                    numbersContainer.appendChild(createPageButton(2));
                    numbersContainer.appendChild(createPageButton(3));
                    numbersContainer.appendChild(createSpacer());
                    numbersContainer.appendChild(createPageButton(totalPages));
                } else if (state.currentPage >= totalPages - 1) {
                    // At the end: 1, ..., second to last, last-1, last
                    numbersContainer.appendChild(createPageButton(1));
                    numbersContainer.appendChild(createSpacer());
                    numbersContainer.appendChild(createPageButton(totalPages - 2));
                    numbersContainer.appendChild(createPageButton(totalPages - 1));
                    numbersContainer.appendChild(createPageButton(totalPages));
                } else {
                    // In the middle: 1, ..., current-1, current, current+1, ..., last
                    numbersContainer.appendChild(createPageButton(1));
                    if (state.currentPage > 3) {
                        numbersContainer.appendChild(createSpacer());
                    }
                    numbersContainer.appendChild(createPageButton(state.currentPage - 1));
                    numbersContainer.appendChild(createPageButton(state.currentPage));
                    numbersContainer.appendChild(createPageButton(state.currentPage + 1));
                    if (state.currentPage < totalPages - 2) {
                        numbersContainer.appendChild(createSpacer());
                    }
                    numbersContainer.appendChild(createPageButton(totalPages));
                }
            }
        }

        // Global function for page navigation (needed for onclick handlers)
        window.goToPage = async function(page) {
            const state = window.currentState;
            if (!state || page === state.currentPage) return;

            state.currentPage = page;
            await renderThreads(state);

            // Ensure floating buttons remain visible on mobile after page change
            ensureFloatingButtonsVisibleOnMobile();
        };

        // Add pagination event listeners (Previous/Next buttons removed)
        function attachPaginationEventListeners(state) {
            // No more Previous/Next buttons - navigation only by clicking page numbers
        }

        async function startUnifiedBackgroundCheck(state) {
            // Protection against multiple checks
            if (state.isCheckingReplies) {
                console.log('Unified check already in progress, stopping this instance');
                return;
            }

            // PAGE TTL CHECK: Respect adaptive delay per page to allow smooth navigation
            const pageCheckKey = `unified_background_check_page_${state.currentPage}`;
            const refreshDelay = getRefreshDelay(state);
            const canCheck = !(await window.kasterDB.isCacheValid(pageCheckKey, refreshDelay));

            if (!canCheck) {
                const delaySeconds = refreshDelay / 1000;
                console.log(`⏳ Page ${state.currentPage} check recent (< ${delaySeconds}s), skipping to avoid API overload`);

                // Display simple message without hourglass icon
                const statusElement = document.getElementById('background-status');
                if (statusElement) {
                    const statusText = statusElement.querySelector('.status-text');
                    const statusIcon = statusElement.querySelector('.status-icon');
                    const statusProgress = statusElement.querySelector('.status-progress');

                    if (statusText && window.i18n) {
                        statusText.textContent = window.i18n.t('status.page_refreshed_recently', {
                            page: state.currentPage,
                            seconds: delaySeconds
                        });
                    }
                    if (statusIcon) {
                        statusIcon.textContent = ''; // No icon
                    }
                    if (statusProgress) {
                        statusProgress.textContent = '';
                    }

                    statusElement.classList.remove('d-none');
                    statusElement.classList.add('d-flex');
                    setTimeout(() => {
                        statusElement.classList.add('d-none');
                        statusElement.classList.remove('d-flex');
                    }, 3000);
                }

                return;
            }

            state.isCheckingReplies = true;

            // Use current page threads for optimal performance (major API optimization)
            const threads = state.currentPageThreads && state.currentPageThreads.length > 0 ? state.currentPageThreads : state.allThreads;
            const isOptimized = threads === state.currentPageThreads;

            console.log(`🔄 Starting unified check ${isOptimized ? '(OPTIMIZED - current page only)' : '(fallback - all threads)'} - TTL respected`);
            console.log(`📊 Checking ${threads.length} threads instead of ${state.allThreads.length} threads (${Math.round((1 - threads.length / state.allThreads.length) * 100)}% API reduction)`);

            let processedCount = 0;

            // Mark the start of the check in the cache (per page)
            await window.kasterDB.setCacheMetadata(pageCheckKey, Date.now());

            // Display unified status
            showBackgroundStatus('status.checking_replies', 0, threads.length);

            try {
                // Process threads one by one with a delay to avoid API overload
                for (const thread of threads) {
                    // Check if we should stop (e.g., if user disconnected)
                    if (!state.isConnected && threads.indexOf(thread) > 10) {
                        console.log('User not connected after 10 threads, stopping new badge check');
                        // Continue for counters but stop new badge check
                    }

                    try {
                        await new Promise(resolve => setTimeout(resolve, 400)); // Reduced delay thanks to pagination

                        // 1. Update total counter (for all)
                        await updateThreadReplyCount(thread.txid);

                        // 2. Check for new replies (only if connected)
                        if (state.isConnected) {
                            await checkAndUpdateThreadReplies(thread.txid, state);
                        }

                        processedCount++;

                        // Update progress counter
                        updateBackgroundStatusProgress(processedCount, threads.length, 'status.checking_replies');

                        console.log(`✅ Unified check completed for ${processedCount}/${threads.length} threads${isOptimized ? ' (current page)' : ''}`);
                    } catch (error) {
                        console.warn(`Error during unified check for thread ${thread.txid}:`, error);
                        processedCount++; // Count even on error for progress
                    }
                }
                console.log(`🎉 Unified check ${isOptimized ? 'OPTIMIZED' : 'complete'} (${processedCount} threads) - Next in 60s minimum`);
            } finally {
                // Hide status after a short delay
                setTimeout(() => {
                    hideBackgroundStatus();
                }, 1000);

                state.isCheckingReplies = false;
            }
        }

        // Deprecated function - kept for compatibility but replaced by startUnifiedBackgroundCheck
        async function startBackgroundRepliesCheck(state) {
            console.warn('startBackgroundRepliesCheck is deprecated, use startUnifiedBackgroundCheck');
            return startUnifiedBackgroundCheck(state);
        }

        async function checkAndUpdateThreadReplies(threadTxid, state) {
            try {
                // Check if this thread was checked recently (adaptive delay)
                const refreshDelay = getRefreshDelay(state);
                const isCacheValid = await window.kasterDB.isCacheValid(`thread_${threadTxid}`, refreshDelay);

                if (isCacheValid) {
                    console.log(`⏭️ Skipping check for ${threadTxid} - valid cache`);
                    return; // No need to check, recent cache
                }

                console.log(`🔍 Checking replies for ${threadTxid}`);

                // Retrieve current number of replies via API (will respect 30s cache)
                const { messages } = await window.kasterAPI.fetchThread(threadTxid);
                const currentReplies = messages.length - 1; // -1 because the first message is the main thread

                // Retrieve previous visit data from cache
                const previousVisit = await window.kasterDB.getThreadVisit(threadTxid);
                const lastViewedReplies = previousVisit ? previousVisit.lastViewedReplies : 0;

                // Calculate number of new replies
                const newReplies = Math.max(0, currentReplies - lastViewedReplies);

                // Update display if there are new replies
                if (newReplies > 0) {
                    updateNewRepliesBadge(threadTxid, newReplies);
                    console.log(`🔔 ${newReplies} new replies for ${threadTxid}`);
                }

                // Update cache with current number of replies (but not visit timestamp)
                // Visit timestamp will only be updated when user clicks on the thread
                if (!previousVisit) {
                    await window.kasterDB.updateThreadVisit(threadTxid, currentReplies, Date.now());
                }

            } catch (error) {
                console.warn(`Could not check replies for thread ${threadTxid}:`, error);
            }
        }

        function updateNewRepliesBadge(threadTxid, newReplies) {
            const container = document.querySelector(`[data-txid="${threadTxid}"] .new-replies-container`);
            if (container) {
                container.classList.remove('d-none');
                const replyText = window.i18n ? (window.i18n.currentLang === 'en' ? (newReplies === 1 ? 'new reply' : 'new replies') : `nouvelle${newReplies > 1 ? 's' : ''} réponse${newReplies > 1 ? 's' : ''}`) : `nouvelle${newReplies > 1 ? 's' : ''} réponse${newReplies > 1 ? 's' : ''}`;
                container.innerHTML = `<span class="new-replies-badge">+${newReplies} ${replyText}</span>`;
            }
        }

        function clearNewRepliesBadge(threadTxid) {
            const container = document.querySelector(`[data-txid="${threadTxid}"] .new-replies-container`);
            if (container) {
                container.classList.add('d-none');
                container.innerHTML = '';
            }
        }

        async function updateThreadReplyCount(threadTxid) {
            try {
                console.log(`🔢 Updating reply count for ${threadTxid}`);

                // First check reply count cache (adaptive TTL)
                const cachedCount = await window.kasterDB.getCachedReplyCount(threadTxid);
                const refreshDelay = getRefreshDelay(window.currentState);
                if (cachedCount && (Date.now() - cachedCount.timestamp) < refreshDelay) {
                    console.log(`📊 Using cache for reply count: ${cachedCount.replyCount} for ${threadTxid}`);

                    // Update display with cached value
                    const countElement = document.querySelector(`[data-txid="${threadTxid}"] .reply-count-number`);
                    if (countElement) {
                        countElement.textContent = cachedCount.replyCount;
                    }

                    return cachedCount.replyCount;
                }

                // Cache expired or non-existent, retrieve via API and filter
                const { messages } = await window.kasterAPI.fetchThread(threadTxid);
                const allReplies = messages.filter(m => m.txid !== threadTxid); // Exclude main thread

                // Filter hidden replies, blacklisted authors, and replies with unwanted terms
                const blacklistedWallets = await window.kasterDB.getBlacklistedWallets();
                const hiddenMessages = await window.kasterDB.getHiddenMessages();

                const filteredReplies = [];
                for (const reply of allReplies) {
                    // Basic checks
                    if (blacklistedWallets.includes(reply.sender_address) ||
                        hiddenMessages.includes(reply.txid)) {
                        continue;
                    }

                    // Check for unwanted terms in reply message
                    const messageCheck = await window.kasterDB.containsFilteredTerms(reply.message || '');
                    if (messageCheck.hasFilteredTerm) {
                        console.log(`🚫 Reply filtered for unwanted terms in counter: ${reply.txid}`, messageCheck.matchedTerms);
                        continue;
                    }

                    filteredReplies.push(reply);
                }

                const replyCount = filteredReplies.length;

                // Cache filtered count for 60 seconds
                await window.kasterDB.setCachedReplyCount(threadTxid, replyCount);
                console.log(`💾 Filtered reply count cached: ${replyCount} for ${threadTxid}`);

                // Update display
                const countElement = document.querySelector(`[data-txid="${threadTxid}"] .reply-count-number`);
                if (countElement) {
                    countElement.textContent = replyCount;
                    console.log(`✅ Filtered reply count updated: ${replyCount} for ${threadTxid}`);
                }

                return replyCount;
            } catch (error) {
                console.warn(`Could not update reply count for ${threadTxid}:`, error);
                return 0;
            }
        }

        // =================================================================
        // --- STATUS UI MANAGEMENT FUNCTIONS ---
        // =================================================================
        function showBackgroundStatus(messageKey = 'status.checking_replies', current = 0, total = 0) {
            const statusElement = document.getElementById('background-status');
            if (!statusElement) return;

            const statusText = statusElement.querySelector('.status-text');
            const statusProgress = statusElement.querySelector('.status-progress');

            statusElement.classList.remove('d-none');
            statusElement.classList.add('d-flex');

            // Update text with translation
            if (statusText && window.i18n) {
                statusText.textContent = window.i18n.t(messageKey);
            }

            // Update progress counter
            if (statusProgress) {
                statusProgress.textContent = `${current}/${total}`;
            }
        }

        function hideBackgroundStatus() {
            const statusElement = document.getElementById('background-status');
            if (statusElement) {
                statusElement.classList.add('d-none');
                statusElement.classList.remove('d-flex');
            }
        }

        function updateBackgroundStatusProgress(current, total, messageKey = 'status.checking_replies') {
            const statusElement = document.getElementById('background-status');
            if (!statusElement) return;

            const statusText = statusElement.querySelector('.status-text');
            const statusProgress = statusElement.querySelector('.status-progress');

            // Update text if necessary
            if (statusText && window.i18n) {
                statusText.textContent = window.i18n.t(messageKey);
            }

            // Update counter
            if (statusProgress) {
                statusProgress.textContent = `${current}/${total}`;
            }
        }

        // Deprecated function - replaced by startUnifiedBackgroundCheck
        // =================================================================
        // --- PUBLICATION VERIFICATION FUNCTIONS ---
        // =================================================================

        async function verifyTransactionPublication(targetAddress, payloadHex, timeoutSeconds = 30) {
            console.log(`🔍 Verifying publication on ${targetAddress.substring(0, 15)}... for ${timeoutSeconds}s`);

            const startTime = Date.now();
            const maxDuration = timeoutSeconds * 1000;

            while (Date.now() - startTime < maxDuration) {
                try {
                    // Retrieve recent transactions for the target address
                    const response = await fetch(`${API_BASE_URL}/addresses/${targetAddress}/full-transactions-page?limit=20&resolve_previous_outpoints=light`);
                    if (response.ok) {
                        const transactions = await response.json();

                        // Look for our transaction in recent ones
                        for (const tx of transactions) {
                            if (tx.payload === payloadHex) {
                                console.log(`✅ Transaction found! TXID: ${tx.transaction_id}`);
                                return {
                                    found: true,
                                    txid: tx.transaction_id,
                                    transaction: tx
                                };
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error during verification:', error);
                }

                // Wait 2 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`⏰ Timeout reached (${timeoutSeconds}s), stopping verification`);
            return {
                found: false,
                txid: null,
                transaction: null
            };
        }

        async function updateAllThreadReplyCounts(state) {
            console.warn('updateAllThreadReplyCounts is deprecated, reply count update is now integrated into startUnifiedBackgroundCheck');

            if (!state.allThreads || state.allThreads.length === 0) {
                return;
            }

            console.log(`🔢 Quick update of reply counts for ${state.allThreads.length} threads (compatibility mode)`);

            // Simplified version for compatibility - without UI status
            for (const thread of state.allThreads) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await updateThreadReplyCount(thread.txid);
                } catch (error) {
                    console.warn(`Error updating reply count for ${thread.txid}:`, error);
                }
            }

            console.log('✅ Compatibility update finished');
        }

        async function handleThreadSubmit(e, state) {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-thread-btn');
            const cancelBtn = document.getElementById('cancel-thread-btn');
            const modal = document.getElementById('newThreadModal');

            // Variable to track if transaction is in progress
            let isTransactionPending = false;

            // Function to handle cancellation
            const handleCancel = () => {
                if (isTransactionPending) {
                    // Reset Kasware transaction if possible
                    try {
                        // Note: Kasware does not provide an official method to cancel,
                        // but we can try to clean up local state
                        console.log('Attempting to cancel transaction...');
                    } catch (e) {
                        console.log('Could not cancel Kasware transaction');
                    }

                    isTransactionPending = false;
                    showStatus('status.publication_cancelled', 'error', 3000);
                }

                // Reset interface
                submitBtn.disabled = false;
                submitBtn.innerHTML = window.i18n ? window.i18n.t('modal.new_thread.submit') : 'Publish';
                modal.classList.remove('d-block');
                document.getElementById('new-thread-form').reset();
            };

            // Attach cancellation event listener
            const originalCancelHandler = cancelBtn.onclick;
            // Remove old handler if present
            if (originalCancelHandler) {
                cancelBtn.removeEventListener('click', originalCancelHandler);
            }
            cancelBtn.addEventListener('click', handleCancel);

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<div class="loading-spinner"></div> ${window.i18n ? window.i18n.t('misc.publishing') : 'Publishing...'}`;

            try {
                const title = document.getElementById('thread-title-input').value;
                const message = document.getElementById('thread-message-input').value;
                const theme = document.getElementById('thread-theme-input').value;
                const language = document.getElementById('thread-language-input').value;
                const priority = 0;

                const payloadBytes = encodePayloadForThread(title, message, theme, language, priority);
                const payloadHex = Array.from(payloadBytes).map(b => b.toString(16).padStart(2, '0')).join('');

                // Mark transaction as in progress
                isTransactionPending = true;

                // Send transaction
                const txid = await window.kasware.sendKaspa(PROTOCOL_ADDRESS, AMOUNT_TO_SEND_SOMPIS, { payload: payloadHex });

                // Transaction sent successfully
                isTransactionPending = false;

                // Close modal immediately
                modal.classList.remove('d-block');
                document.getElementById('new-thread-form').reset();

                // Display status message asking to refresh
                showStatus('status.thread_sent_refresh', 'success', 10000);

                // Restore original cancel handler
                cancelBtn.removeEventListener('click', handleCancel);
                if (originalCancelHandler) {
                    cancelBtn.addEventListener('click', originalCancelHandler);
                }

            } catch (error) {
                console.error("Publication error:", error);
                isTransactionPending = false;

                // Display error but keep modal open to allow retrying
                showStatus(error.message || (window.i18n ? window.i18n.t('status.transaction_failed') : "Transaction refused/failed."), 'error');

                // Restore original cancel handler
                cancelBtn.removeEventListener('click', handleCancel);
                if (originalCancelHandler) {
                    cancelBtn.addEventListener('click', originalCancelHandler);
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = window.i18n ? window.i18n.t('modal.new_thread.submit') : 'Publish';
            }
        }

        function encodePayloadForThread(title, message, theme, lang, priority) {
            const encoder = new TextEncoder();
            // Limit title to 40 characters to avoid overflow
            const truncatedTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
            const titleBytes = encoder.encode(truncatedTitle), messageBytes = encoder.encode(message), themeBytes = encoder.encode(theme), langBytes = encoder.encode(lang);
            if (titleBytes.length > MAX_TITLE_BYTES || messageBytes.length > MAX_MESSAGE_BYTES) throw new Error("Title or message too long.");
            const parentTxidBytes = new Uint8Array(32).fill(0);
            const payloadSize = 1 + 32 + 2 + themeBytes.length + 2 + langBytes.length + 1 + 2 + titleBytes.length + 2 + messageBytes.length;
            const buffer = new ArrayBuffer(payloadSize), view = new DataView(buffer); let offset = 0;
            view.setUint8(offset, 4); offset += 1;
            new Uint8Array(buffer, offset).set(parentTxidBytes); offset += 32;
            view.setUint16(offset, themeBytes.length, false); offset += 2; new Uint8Array(buffer, offset).set(themeBytes); offset += themeBytes.length;
            view.setUint16(offset, langBytes.length, false); offset += 2; new Uint8Array(buffer, offset).set(langBytes); offset += langBytes.length;
            view.setUint8(offset, priority); offset += 1;
            view.setUint16(offset, titleBytes.length, false); offset += 2; new Uint8Array(buffer, offset).set(titleBytes); offset += titleBytes.length;
            view.setUint16(offset, messageBytes.length, false); offset += 2; new Uint8Array(buffer, offset).set(messageBytes);
            return new Uint8Array(buffer);
        }

        function updateCharCounter(inputId, counterId, maxBytes) {
            const text = document.getElementById(inputId).value, counter = document.getElementById(counterId);
            const byteLength = new TextEncoder().encode(text).length;
            counter.textContent = `${byteLength}/${maxBytes} bytes`;
            counter.className = byteLength > maxBytes ? 'char-counter error' : 'char-counter';
        }

        // =================================================================
        // --- thread.js (Thread Logic - Adapted to new API) ---
        // =================================================================
        async function initializeThreadPage() {
            const state = { isConnected: false, userAddress: '', threadTxid: null, threadData: null, replies: [] };
            const urlParams = new URLSearchParams(window.location.search);
            state.threadTxid = urlParams.get('txid');
            if (!state.threadTxid) { document.body.innerHTML = `<h1>${window.i18n ? window.i18n.t('error.missing_txid') : 'Error: Missing transaction ID.'}</h1>`; return; }

            // Force hide redundant floating buttons on thread page
            const createBtn = document.getElementById('create-thread-btn-floating');
            const refreshBtn = document.getElementById('refresh-btn-floating');
            if (createBtn) createBtn.classList.add('d-none');
            if (refreshBtn) refreshBtn.classList.add('d-none');

            try {
                await window.kasterDB.init();
                const walletState = await tryRestoreWalletConnection();
                Object.assign(state, walletState);
                initializeSharedUI(state);
                attachThreadPageEventListeners(state);
                await loadAndDisplaySingleThread(state);
            } catch (error) {
                console.error("Thread initialization error:", error);
                showStatus("error.init_error", 'error', 10000);
            }
        }

        function attachThreadPageEventListeners(state) {
            document.getElementById('reply-form')?.addEventListener('submit', (e) => handleReplySubmit(e, state));
            document.getElementById('reply-message')?.addEventListener('input', updateReplyCharCounter);
            document.getElementById('main-thread-actions')?.addEventListener('click', (e) => handleThreadAction(e, state));
            document.getElementById('refresh-thread-btn')?.addEventListener('click', () => handleRefreshThreadClick(state));
            // Event listener for reply actions
            document.getElementById('replies-container')?.addEventListener('click', (e) => handleReplyAction(e, state));
        }

        async function loadAndDisplaySingleThread(state) {
            const mainContent = document.getElementById('thread-main-content');
            showLoadingState(true);

            // Removed: Mandatory KasWare check before accessing thread
            // Thread will now attempt to load regardless of KasWare presence.

            try {
                const { messages, thread_info } = await window.kasterAPI.fetchThread(state.threadTxid);
                if (!thread_info) { mainContent.innerHTML = `<h1>${window.i18n ? window.i18n.t('error.thread_not_found') : 'Thread not found.'}</h1>`; return; }
                state.threadData = thread_info;
                state.replies = messages.filter(m => m.txid !== state.threadTxid);
                renderThreadHeader(state.threadData);
                // Filter hidden replies, blacklisted authors, and replies with unwanted terms
                const blacklistedWallets = await window.kasterDB.getBlacklistedWallets();
                const hiddenMessages = await window.kasterDB.getHiddenMessages();

                const filteredReplies = [];
                for (const reply of state.replies) {
                    // Basic checks
                    if (blacklistedWallets.includes(reply.sender_address) ||
                        hiddenMessages.includes(reply.txid)) {
                        continue;
                    }

                    // Check for unwanted terms in reply message
                    const messageCheck = await window.kasterDB.containsFilteredTerms(reply.message || '');

                    if (messageCheck.hasFilteredTerm) {
                        console.log(`🚫 Reply filtered for unwanted terms: ${reply.txid}`, messageCheck.matchedTerms);
                        continue;
                    }

                    filteredReplies.push(reply);
                }
                renderReplies(filteredReplies);
                updateReplyFormState(state); // This will correctly disable reply if not connected

                // Mark this thread as visited with the current number of replies
                await markThreadAsVisited(state.threadTxid, state.replies.length);

            } catch (error) {
                console.error("Error loading thread:", error);
                // Modified error message
                mainContent.innerHTML = `<h1>${window.i18n ? window.i18n.t('error.loading_error') : 'Error loading thread. The Kaspa API may be temporarily unavailable or an error occurred.'}</h1>`;
                showStatus('error.loading_error', 'error');
            } finally {
                showLoadingState(false);
            }
        }

        async function markThreadAsVisited(txid, replyCount) {
            try {
                await window.kasterDB.updateThreadVisit(txid, replyCount, Date.now());
                console.log(`Thread ${txid} marked as visited with ${replyCount} replies`);
            } catch (error) {
                console.warn('Error updating thread visit:', error);
            }
        }

        function showLoadingState(isLoading) {
            const placeholder = document.getElementById('loading-placeholder');
            const content = document.getElementById('thread-main-content');

            placeholder.classList.toggle('d-block', isLoading);
            placeholder.classList.toggle('d-none', !isLoading);

            content.classList.toggle('d-block', !isLoading);
            content.classList.toggle('d-none', isLoading);
        }

        function renderThreadHeader(thread) {
            // Breadcrumb: 50 max characters with "..." (doubled)
            const breadcrumbTitle = thread.title && thread.title.length > 50
                ? thread.title.substring(0, 50) + '...'
                : thread.title || 'Discussion';

            // Main bold title: 20 max characters with "..." (doubled)
            const mainTitle = thread.title && thread.title.length > 20
                ? thread.title.substring(0, 20) + '...'
                : thread.title || 'Discussion';

            document.getElementById('thread-title').textContent = mainTitle;
            document.getElementById('thread-title').title = thread.title; // Full title on hover
            document.getElementById('breadcrumb-current').textContent = breadcrumbTitle;
            // Format address without kaspa: prefix
            const cleanAddress = thread.sender_address.replace(/^kaspa:/, '');
            document.getElementById('thread-author-address').textContent = truncateAddress(cleanAddress, 6, 4);
            document.getElementById('thread-author-address').title = thread.sender_address;
            document.getElementById('thread-date').textContent = new Date(thread.block_time).toLocaleString(window.i18n?.currentLang === 'en' ? 'en-US' : 'fr-FR');
            document.getElementById('thread-txid').textContent = truncateAddress(thread.txid, 6, 4);
            document.getElementById('thread-txid').href = `https://explorer.kaspa.org/txs/${thread.txid}`;
            document.getElementById('thread-message-body').textContent = thread.message;
        }

        function renderReplies(filteredReplies) {
            const container = document.getElementById('replies-container');
            const repliesCountEl = document.getElementById('replies-count');

            if (repliesCountEl) {
                repliesCountEl.textContent = `(${filteredReplies.length})`;
            }

            if (!container) {
                console.error('Element replies-container not found');
                return;
            }

            if (filteredReplies.length === 0) {
                container.innerHTML = `<p>${window.i18n ? window.i18n.t('thread.no_replies') : 'No replies yet.'}</p>`;
                return;
            }

            // FIX: Using DOM element creation to prevent XSS vulnerabilities
            container.innerHTML = ''; // Clear container
            filteredReplies.forEach(reply => {
                const cleanAddress = reply.sender_address.replace(/^kaspa:/, '');

                const replyDiv = document.createElement('div');
                replyDiv.className = 'reply';
                replyDiv.id = `reply-${reply.txid}`;

                const metadataDiv = document.createElement('div');
                metadataDiv.className = 'message-metadata';

                const metadataLineDiv = document.createElement('div');
                metadataLineDiv.className = 'metadata-line';

                const authorSpan = document.createElement('span');
                const authorStrong = document.createElement('strong');
                authorStrong.title = reply.sender_address;
                authorStrong.textContent = truncateAddress(cleanAddress);
                authorSpan.textContent = `${window.i18n ? window.i18n.t('meta.by') : 'By:'} `;
                authorSpan.appendChild(authorStrong);

                const dateSpan = document.createElement('span');
                dateSpan.textContent = new Date(reply.block_time).toLocaleString(window.i18n?.currentLang === 'en' ? 'en-US' : 'fr-FR');

                metadataLineDiv.append(authorSpan, dateSpan);
                metadataDiv.appendChild(metadataLineDiv);

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'message-body';
                bodyDiv.textContent = reply.message; // Using textContent

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                actionsDiv.className = 'message-actions message-actions-reply';

                // Create action buttons
                const hideButton = document.createElement('button');
                hideButton.dataset.action = 'hide';
                hideButton.dataset.replyTxid = reply.txid;
                hideButton.className = 'button-secondary-small';
                hideButton.dataset.i18n = 'thread.actions.hide';
                hideButton.textContent = window.i18n ? window.i18n.t('thread.actions.hide') : 'Hide';

                const blacklistButton = document.createElement('button');
                blacklistButton.dataset.action = 'blacklist';
                blacklistButton.dataset.replyAddress = reply.sender_address;
                blacklistButton.className = 'button-secondary-small';
                blacklistButton.dataset.i18n = 'thread.actions.blacklist';
                blacklistButton.textContent = window.i18n ? window.i18n.t('thread.actions.blacklist') : 'Blacklist';

                const donateButton = document.createElement('button');
                donateButton.dataset.action = 'donate';
                donateButton.dataset.replyAddress = reply.sender_address;
                donateButton.className = 'button-primary-small';
                donateButton.dataset.i18n = 'thread.actions.donate';
                donateButton.textContent = window.i18n ? window.i18n.t('thread.actions.donate') : 'Donate';

                actionsDiv.append(hideButton, blacklistButton, donateButton);
                replyDiv.append(metadataDiv, bodyDiv, actionsDiv);
                container.appendChild(replyDiv);
            });
        }

        function updateReplyFormState(state) {
            const replyContainer = document.getElementById('reply-form-container');
            const replyWarning = document.getElementById('reply-warning');

            replyContainer.classList.toggle('d-block', state.isConnected);
            replyContainer.classList.toggle('d-none', !state.isConnected);

            replyWarning.classList.toggle('d-flex', !state.isConnected);
            replyWarning.classList.toggle('d-none', state.isConnected);
        }

        async function handleReplySubmit(e, state) {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-reply-btn');
            const replyForm = document.getElementById('reply-form');

            // Variable to track if transaction is in progress
            let isTransactionPending = false;

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<div class="loading-spinner"></div> ${window.i18n ? window.i18n.t('misc.publishing') : 'Publishing...'}`;

            try {
                const message = document.getElementById('reply-message').value;
                const payloadBytes = encodePayloadForReply(message, state.threadTxid);
                const payloadHex = Array.from(payloadBytes).map(b => b.toString(16).padStart(2, '0')).join('');

                // Mark transaction as in progress
                isTransactionPending = true;

                // Note: Replies are sent to the original author's address
                const txid = await window.kasware.sendKaspa(state.threadData.sender_address, AMOUNT_TO_SEND_SOMPIS, { payload: payloadHex });

                // Transaction sent successfully
                isTransactionPending = false;

                // Reset form immediately
                replyForm.reset();

                // Display status message asking to refresh
                showStatus('status.reply_sent_refresh', 'success', 10000);

            } catch (error) {
                console.error("Reply sending error:", error);
                isTransactionPending = false;

                // Display error
                showStatus(error.message || (window.i18n ? window.i18n.t('status.transaction_failed') : "Transaction refused/failed."), 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = window.i18n ? window.i18n.t('thread.reply_submit') : 'Publish';
            }
        }

        function encodePayloadForReply(message, parentTxid) {
            const messageBytes = new TextEncoder().encode(message);
            if (messageBytes.length > MAX_MESSAGE_BYTES) throw new Error("Message too long.");
            const parentTxidBytes = window.kasterAPI.hexToBytes(parentTxid);
            const payloadSize = 1 + 32 + 2 + 0 + 2 + 0 + 1 + 2 + 0 + 2 + messageBytes.length;
            const buffer = new ArrayBuffer(payloadSize), view = new DataView(buffer); let offset = 0;
            view.setUint8(offset, 4); offset += 1;
            new Uint8Array(buffer, offset).set(parentTxidBytes); offset += 32;
            view.setUint16(offset, 0, false); offset += 2; // theme
            view.setUint16(offset, 0, false); offset += 2; // lang
            view.setUint8(offset, 0); offset += 1; // priority
            view.setUint16(offset, 0, false); offset += 2; // title
            view.setUint16(offset, messageBytes.length, false); offset += 2; new Uint8Array(buffer, offset).set(messageBytes);
            return new Uint8Array(buffer);
        }

        function updateReplyCharCounter() {
            const message = document.getElementById('reply-message').value, counter = document.getElementById('reply-char-counter');
            const messageBytes = new TextEncoder().encode(message).length;
            if (counter) {
                counter.textContent = `${messageBytes}/${MAX_MESSAGE_BYTES} bytes`;
                counter.className = messageBytes > MAX_MESSAGE_BYTES ? 'char-counter error' : 'char-counter';
            }
        }

        async function handleThreadAction(e, state) {
            const button = e.target.closest('button'); if (!button) return;
            const action = button.dataset.action, authorAddress = state.threadData.sender_address, txid = state.threadData.txid;
            switch (action) {
                case 'hide':
                    if (confirm(window.i18n ? window.i18n.t('confirm.hide_message') : 'Really hide this message?')) {
                        await window.kasterDB.hideMessage(txid);
                        showStatus('status.message_hidden', 'success');
                        setTimeout(() => window.location.href = '/', 2000);
                    }
                    break;
                case 'blacklist':
                    if (confirm(window.i18n ? window.i18n.t('confirm.blacklist_wallet', {address: truncateAddress(authorAddress)}) : `Really blacklist ${truncateAddress(authorAddress)}?`)) {
                        await window.kasterDB.blacklistWallet(authorAddress);
                        showStatus('status.wallet_blacklisted', 'success');
                        setTimeout(() => window.location.href = '/', 2000);
                    }
                    break;
                case 'donate':
                    if (!state.isConnected) { showStatus("status.connect_wallet_for_donation", 'error'); return; }
                    const amountStr = prompt(window.i18n ? window.i18n.t('confirm.donation_amount') : "Donation amount in KAS?", "1");
                    const amount = parseFloat(amountStr);
                    if (amount && amount > 0) {
                        try {
                            const tx = await window.kasware.sendKaspa(authorAddress, Math.floor(amount * 1e8));
                            showStatus(window.i18n ? window.i18n.t('status.donation_sent', {amount}) : `Donation of ${amount} KAS sent!`, 'success', 10000);
                        } catch (error) { showStatus(error.message || (window.i18n ? window.i18n.t('status.donation_failed') : "Donation transaction failed."), 'error'); }
                    }
                    break;
            }
        }

        async function handleReplyAction(e, state) {
            const button = e.target.closest('button'); if (!button) return;
            const action = button.dataset.action;

            switch (action) {
                case 'hide':
                    const replyTxid = button.dataset.replyTxid;
                    if (confirm(window.i18n ? window.i18n.t('confirm.hide_message') : 'Really hide this reply?')) {
                        await window.kasterDB.hideMessage(replyTxid);
                        showStatus('status.message_hidden', 'success');
                        // Visually remove the reply
                        const replyElement = document.getElementById(`reply-${replyTxid}`);
                        if (replyElement) {
                            replyElement.remove();
                            // Update counter
                            const repliesCountEl = document.getElementById('replies-count');
                            if (repliesCountEl) {
                                const currentCount = state.replies.length - 1; // -1 for the deleted reply
                                repliesCountEl.textContent = `(${currentCount})`;
                            }
                        }
                    }
                    break;
                case 'blacklist':
                    const replyAddress = button.dataset.replyAddress;
                    const cleanAddress = replyAddress.replace(/^kaspa:/, '');
                    if (confirm(window.i18n ? window.i18n.t('confirm.blacklist_wallet', {address: truncateAddress(cleanAddress)}) : `Really blacklist ${truncateAddress(cleanAddress)}?`)) {
                        await window.kasterDB.blacklistWallet(replyAddress);
                        showStatus('status.wallet_blacklisted', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    }
                    break;
                case 'donate':
                    const donateAddress = button.dataset.replyAddress;
                    if (!state.isConnected) { showStatus("status.connect_wallet_for_donation", 'error'); return; }
                    const amountStr = prompt(window.i18n ? window.i18n.t('confirm.donation_amount') : "Donation amount in KAS?", "1");
                    const amount = parseFloat(amountStr);
                    if (amount && amount > 0) {
                        try {
                            const tx = await window.kasware.sendKaspa(donateAddress, Math.floor(amount * 1e8));
                            showStatus(window.i18n ? window.i18n.t('status.donation_sent', {amount}) : `Donation of ${amount} KAS sent!`, 'success', 10000);
                        } catch (error) { showStatus(error.message || (window.i18n ? window.i18n.t('status.donation_failed') : "Donation transaction failed."), 'error'); }
                    }
                    break;
            }
        }

        // =================================================================
        // --- REFRESH FUNCTIONS ---
        // =================================================================

        // Utility function to get refresh delay based on connection status
        function getRefreshDelay(state) {
            return state && state.isConnected ? 15000 : 60000; // 15s if connected, 60s otherwise
        }

        // Function to get adaptive refresh error message
        function getRefreshErrorMessage(state) {
            const seconds = getRefreshDelay(state) / 1000;
            const key = state && state.isConnected ? 'status.refresh_recent_15' : 'status.refresh_recent_60';
            return window.i18n ? window.i18n.t(key) : `⏳ Recent refresh, please wait ${seconds} seconds`;
        }

        async function handleRefreshClick(state) {
            // Check if refresh is allowed (adaptive delay based on connection)
            const refreshDelay = getRefreshDelay(state);
            const canRefresh = !(await window.kasterDB.isCacheValid('threads_list', refreshDelay));

            if (!canRefresh) {
                showStatus(getRefreshErrorMessage(state), "error");
                return;
            }

            console.log('🔄 Manually refreshing thread list');

            // Disable button and add animation
            const buttons = [document.getElementById('refresh-btn'), document.getElementById('refresh-btn-floating')];
            buttons.forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('loading');
                    btn.innerHTML = btn === document.getElementById('refresh-btn') ? `🔄 ${window.i18n ? window.i18n.t('misc.refreshing') : 'Refreshing...'}` : '🔄';
                }
            });

            try {
                // Invalidate cache to force refresh
                await window.kasterDB.setCacheMetadata('threads_list', 0);

                // Reload threads
                await loadAndDisplayThreads(state);

                showStatus("status.refreshed", "success");
            } catch (error) {
                console.error('Refresh error:', error);
                showStatus("status.refresh_error", "error");
            } finally {
                // Re-enable buttons
                buttons.forEach(btn => {
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.remove('loading');
                        btn.innerHTML = btn === document.getElementById('refresh-btn') ? `🔄 ${window.i18n ? window.i18n.t('nav.refresh').replace('🔄 ', '') : 'Refresh'}` : '🔄';
                    }
                });
            }
        }

        async function handleRefreshThreadClick(state) {
            // Check if refresh is allowed (adaptive delay based on connection)
            const refreshDelay = getRefreshDelay(state);
            const canRefresh = !(await window.kasterDB.isCacheValid(`thread_${state.threadTxid}`, refreshDelay));

            if (!canRefresh) {
                showStatus(getRefreshErrorMessage(state), "error");
                return;
            }

            console.log(`🔄 Manually refreshing thread ${state.threadTxid}`);

            // Disable button and add animation
            const button = document.getElementById('refresh-thread-btn');
            if (button) {
                button.disabled = true;
                button.classList.add('loading');
                button.innerHTML = `🔄 ${window.i18n ? window.i18n.t('misc.refreshing') : 'Refreshing...'}`;
            }

            try {
                // Invalidate cache for this thread
                await window.kasterDB.setCacheMetadata(`thread_${state.threadTxid}`, 0);

                // Reload thread
                await loadAndDisplaySingleThread(state);

                showStatus("status.thread_refreshed", "success");
            } catch (error) {
                console.error('Thread refresh error:', error);
                showStatus("status.refresh_error", "error");
            } finally {
                // Re-enable button
                if (button) {
                    button.disabled = false;
                    button.classList.remove('loading');
                    button.innerHTML = `🔄 ${window.i18n ? window.i18n.t('nav.refresh_thread').replace('🔄 ', '') : 'Refresh'}`;
                }
            }
        }

        // =================================================================
        // --- ROUTER (Unchanged) ---
        // =================================================================
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const txid = urlParams.get('txid');

            // Variables are defined HERE, before use!
            const pageIndex = document.getElementById('page-index');
            const pageThread = document.getElementById('page-thread');

            if (txid) {
                pageIndex.classList.remove('d-block');
                pageIndex.classList.add('d-none');
                pageThread.classList.remove('d-none');
                pageThread.classList.add('d-block');
                initializeThreadPage();
            } else {
                pageIndex.classList.remove('d-none');
                pageIndex.classList.add('d-block');
                pageThread.classList.remove('d-block');
                pageThread.classList.add('d-none');
                initializeIndexPage();
            }
        });

})();