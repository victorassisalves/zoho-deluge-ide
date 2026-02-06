/**
 * Zoho Deluge Advanced IDE
 * Main logic script
 */

window.onerror = function(msg, url, line, col, error) {
    console.error('[ZohoIDE Global Error]', msg, 'at', url, ':', line, ':', col, error);
    // Don't alert in production if it's just a chrome api missing in some contexts
    if (typeof chrome === 'undefined') return;
    alert('IDE Error: ' + msg);
};

let editor;

console.log('[ZohoIDE] ide.js loading...');

function initEditor() {
    if (editor) return;

    console.log('[ZohoIDE] initEditor() called');

    const container = document.getElementById('editor-container');
    if (!container) {
        console.error('[ZohoIDE] Editor container not found!');
        return;
    }

    if (typeof registerDelugeLanguage === 'function') {
        try {
            registerDelugeLanguage();
            console.log('[ZohoIDE] Deluge language registered.');
        } catch (e) {
            console.error('[ZohoIDE] Failed to register Deluge language:', e);
        }
    }

    try {
        if (!window.monaco) {
            throw new Error('Monaco library not found. Check if assets/monaco-editor is correct.');
        }

        editor = monaco.editor.create(container, {
            value: '// Start coding in Zoho Deluge...\n\ninfo "Hello, World!";',
            language: 'deluge',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: false,
            cursorStyle: 'line',
            glyphMargin: true,
            readOnly: false
        });

        console.log('[ZohoIDE] Monaco Editor created successfully.');

        editor.onDidChangeCursorPosition((e) => {
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Load saved code
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['saved_deluge_code'], (result) => {
                if (result.saved_deluge_code) {
                    editor.setValue(result.saved_deluge_code);
                    log('System', 'Loaded previously saved code.');
                }
            });
        }

        // Auto-save
        let autoSaveTimeout;
        editor.onDidChangeModelContent(() => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                const code = editor.getValue();
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ 'saved_deluge_code': code });
                }
                const syncEl = document.getElementById('sync-status');
                if (syncEl) syncEl.innerText = 'Auto-saved';
                setTimeout(() => {
                    if (syncEl && syncEl.innerText === 'Auto-saved') {
                        checkConnection();
                    }
                }, 2000);
            }, 1000);
        });

        setupEventHandlers();
        checkConnection();
        setInterval(checkConnection, 5000);

    } catch (e) {
        console.error('[ZohoIDE] Critical failure during editor creation:', e);
        container.innerHTML = `<div style="color:white;background:#333;padding:20px;border:1px solid red;">
            <h3 style="color:red;">Failed to load Monaco Editor</h3>
            <p>${e.message}</p>
            <p>If you see 'chrome is not defined', this is normal when viewing the file directly.
               In the extension, this indicates a real problem.</p>
        </div>`;
    }
}

function checkConnection() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.log('[ZohoIDE] Offline mode (No Chrome API)');
        return;
    }

    chrome.runtime.sendMessage({ action: 'CHECK_CONNECTION' }, (response) => {
        const statusEl = document.getElementById('status-indicator');
        const syncStatusEl = document.getElementById('sync-status');

        if (chrome.runtime.lastError) {
            console.warn('[ZohoIDE] Connection check failed:', chrome.runtime.lastError.message);
            return;
        }

        if (response && response.connected) {
            if (statusEl) {
                statusEl.innerText = (response.isStandalone ? 'Target: ' : 'Local: ') + (response.tabTitle || 'Zoho Tab');
                statusEl.style.color = '#4ec9b0';
            }
            if (syncStatusEl) syncStatusEl.innerText = 'Connected';
        } else {
            if (statusEl) {
                statusEl.innerText = 'Local Mode (No Zoho Tab)';
                statusEl.style.color = '#888';
            }
            if (syncStatusEl) syncStatusEl.innerText = 'Local';
        }
    });
}

function setupEventHandlers() {
    console.log('[ZohoIDE] Setting up event handlers...');

    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, fn);
            console.log(`[ZohoIDE] Bound ${event} to #${id}`);
        } else {
            console.error(`[ZohoIDE] Could not find element #${id} to bind ${event}`);
        }
    };

    bind('new-btn', 'click', () => {
        if (confirm('Start a new script? Unsaved changes in the editor will be lost.')) {
            editor.setValue('// New Zoho Deluge Script\n\n');
            log('System', 'New script started.');
        }
    });

    bind('pull-btn', 'click', pullFromZoho);
    bind('push-btn', 'click', pushToZoho);
    bind('save-btn', 'click', saveLocally);

    bind('clear-console', 'click', () => {
        const activePanel = document.querySelector('.panel-content.active');
        if (activePanel) activePanel.innerHTML = '';
    });

    bind('manual-console-btn', 'click', () => {
        const result = prompt('Enter manual console output:');
        if (result) updateConsole(result);
    });

    // Panel tabs
    document.querySelectorAll('.panel-header .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveLocally();
        }
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'IDE_CONSOLE_UPDATE') {
                updateConsole(request.data);
            }
        });
    }
}

function updateConsole(data) {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput && consoleOutput.dataset.lastOutput !== data) {
        log('Zoho', data);
        consoleOutput.dataset.lastOutput = data;
    }
}

function log(type, message) {
    console.log(`[ZohoIDE Log] ${type}: ${message}`);
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type.toLowerCase()}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.innerText = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function pullFromZoho() {
    log('System', 'Searching for code in Zoho tab...');
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        log('Error', 'Extension API not available.');
        return;
    }

    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
        if (chrome.runtime.lastError) {
            log('Error', 'Communication failed: ' + chrome.runtime.lastError.message);
            return;
        }
        if (response && response.code) {
            editor.setValue(response.code);
            log('Success', 'Code pulled successfully.');
        } else if (response && response.error) {
            log('Error', response.error);
        } else {
            log('Error', 'No code found. Is the Zoho editor open?');
        }
    });
}

function pushToZoho() {
    if (!editor) return;
    const code = editor.getValue();
    log('System', 'Pushing code to Zoho tab...');
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        log('Error', 'Extension API not available.');
        return;
    }

    chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (response) => {
        if (chrome.runtime.lastError) {
            log('Error', 'Communication failed: ' + chrome.runtime.lastError.message);
            return;
        }
        if (response && response.success) {
            log('Success', 'Code pushed successfully.');
        } else if (response && response.error) {
            log('Error', response.error);
        } else {
            log('Error', 'Push failed. Ensure the Zoho tab is active.');
        }
    });
}

function saveLocally() {
    if (!editor) return;
    const code = editor.getValue();
    log('System', 'Saving locally...');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'saved_deluge_code': code }, () => {
            log('Success', 'Code saved locally.');
        });
    } else {
        log('Error', 'Storage API not available.');
    }
}

// In case it was already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEditor();
} else {
    document.addEventListener('DOMContentLoaded', initEditor);
}

// Compact UI
if (window.location.search.includes('mode=sidepanel') || window.location.hash.includes('sidepanel')) {
    document.documentElement.classList.add('sidepanel-mode');
}
