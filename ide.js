/**
 * Zoho Deluge Advanced IDE - Main Logic
 */

let editor;
let isConnected = false;

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
        if (typeof monaco === 'undefined') {
            throw new Error('Monaco library not found. Check loader-init.js and network errors.');
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
            readOnly: false,
            fixedOverflowWidgets: true
        });

        console.log('[ZohoIDE] Monaco Editor created successfully.');

        editor.onDidChangeCursorPosition((e) => {
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Load saved code
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['saved_deluge_code'], (result) => {
                if (result.saved_deluge_code && editor) {
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
                if (!editor) return;
                const code = editor.getValue();
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ 'saved_deluge_code': code });
                }
                const syncEl = document.getElementById('sync-status');
                if (syncEl) {
                    const originalText = syncEl.innerText;
                    syncEl.innerText = 'Auto-saved';
                    setTimeout(() => {
                        if (syncEl && syncEl.innerText === 'Auto-saved') {
                            syncEl.innerText = isConnected ? 'Connected' : 'Local';
                        }
                    }, 2000);
                }
            }, 1000);
        });

        setupEventHandlers();
        checkConnection();
        setInterval(checkConnection, 5000);

    } catch (e) {
        console.error('[ZohoIDE] Critical failure during editor creation:', e);
        container.innerHTML = `<div style="color:white;background:#333;padding:20px;border:1px solid red;height:100%;overflow:auto;">
            <h3 style="color:red;">Failed to load Monaco Editor</h3>
            <p style="font-family:monospace;background:#222;padding:10px;">${e.message}</p>
            <p>Common causes:</p>
            <ul>
                <li>Worker script failed to load (Check console)</li>
                <li>Content Security Policy (CSP) restriction</li>
                <li>Missing files in assets/monaco-editor</li>
            </ul>
            <button onclick="window.location.reload()" style="background:#0067ff;color:white;border:none;padding:10px 20px;cursor:pointer;border-radius:4px;">Reload IDE</button>
        </div>`;
    }
}

function checkConnection() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        return;
    }

    chrome.runtime.sendMessage({ action: 'CHECK_CONNECTION' }, (response) => {
        const statusEl = document.getElementById('status-indicator');
        const syncStatusEl = document.getElementById('sync-status');

        if (chrome.runtime.lastError) {
            console.warn('[ZohoIDE] Connection check failed:', chrome.runtime.lastError.message);
            isConnected = false;
            return;
        }

        if (response && response.connected) {
            isConnected = true;
            if (statusEl) {
                statusEl.innerText = (response.isStandalone ? 'Target: ' : 'Local: ') + (response.tabTitle || 'Zoho Tab');
                statusEl.style.color = '#4ec9b0';
            }
            if (syncStatusEl) syncStatusEl.innerText = 'Connected';
        } else {
            isConnected = false;
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
        } else {
            console.warn(`[ZohoIDE] Could not find element #${id} to bind ${event}`);
        }
    };

    bind('new-btn', 'click', () => {
        if (!editor) return;
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

    // Handle objects or multi-line messages
    if (typeof message === 'object') message = JSON.stringify(message, null, 2);

    entry.innerText = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Keep console from growing too large
    if (consoleOutput.childNodes.length > 100) {
        consoleOutput.removeChild(consoleOutput.firstChild);
    }
}

function pullFromZoho() {
    if (!editor) {
        alert('Editor not ready.');
        return;
    }

    log('System', 'Searching for code in Zoho tab...');
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        log('Error', 'Extension API not available.');
        return;
    }

    const pullBtn = document.getElementById('pull-btn');
    if (pullBtn) pullBtn.disabled = true;

    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
        if (pullBtn) pullBtn.disabled = false;

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
            log('Error', 'No code found. Ensure a Zoho editor is open and has content.');
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

    const pushBtn = document.getElementById('push-btn');
    if (pushBtn) pushBtn.disabled = true;

    chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (response) => {
        if (pushBtn) pushBtn.disabled = false;

        if (chrome.runtime.lastError) {
            log('Error', 'Communication failed: ' + chrome.runtime.lastError.message);
            return;
        }

        if (response && response.success) {
            log('Success', 'Code pushed successfully.');
        } else if (response && response.error) {
            log('Error', response.error);
        } else {
            log('Error', 'Push failed. Is the Zoho tab still open?');
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

// Initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEditor();
} else {
    document.addEventListener('DOMContentLoaded', initEditor);
}

// UI Mode handling
if (window.location.search.includes('mode=sidepanel') || window.location.hash.includes('sidepanel')) {
    document.documentElement.classList.add('sidepanel-mode');
}
