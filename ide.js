/**
 * Zoho Deluge Advanced IDE - Main Logic
 */

let editor;
let isConnected = false;

console.log('[ZohoIDE] ide.js loading...');

function initEditor() {
    if (editor) return;

    const container = document.getElementById('editor-container');
    if (!container) return;

    if (typeof registerDelugeLanguage === 'function') {
        registerDelugeLanguage();
    }

    try {
        editor = monaco.editor.create(container, {
            value: '// Start coding in Zoho Deluge...\n\ninfo "Hello, World!";',
            language: 'deluge',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            readOnly: false,
            fixedOverflowWidgets: true
        });

        editor.onDidChangeCursorPosition((e) => {
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Load saved code
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['saved_deluge_code'], (result) => {
                if (result.saved_deluge_code && editor) {
                    editor.setValue(result.saved_deluge_code);
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
                if (syncEl) syncEl.innerText = 'Saved';
            }, 1000);
        });

        setupEventHandlers();
        checkConnection();
        setInterval(checkConnection, 5000);

    } catch (e) {
        console.error('[ZohoIDE] Monaco Load Error:', e);
    }
}

function checkConnection() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
    chrome.runtime.sendMessage({ action: 'CHECK_CONNECTION' }, (response) => {
        const statusEl = document.getElementById('status-indicator');
        const syncStatusEl = document.getElementById('sync-status');
        if (response && response.connected) {
            isConnected = true;
            if (statusEl) {
                statusEl.innerText = (response.isStandalone ? 'Target: ' : 'Local: ') + (response.tabTitle || 'Zoho Tab');
                statusEl.style.color = '#4ec9b0';
            }
        } else {
            isConnected = false;
            if (statusEl) statusEl.innerText = 'Disconnected';
        }
    });
}

function setupEventHandlers() {
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    bind('new-btn', 'click', () => {
        if (confirm('Start a new script?')) {
            editor.setValue('// New Zoho Deluge Script\n\n');
        }
    });

    bind('pull-btn', 'click', pullFromZoho);
    bind('push-btn', 'click', pushToZoho);
    bind('save-btn', 'click', saveLocally);

    // JSON Modal handlers
    const modal = document.getElementById('json-modal');
    bind('json-btn', 'click', () => {
        modal.style.display = 'flex';
        document.getElementById('json-input').focus();
    });

    bind('modal-cancel', 'click', () => {
        modal.style.display = 'none';
    });

    bind('modal-convert', 'click', () => {
        const json = document.getElementById('json-input').value;
        if (!json.trim()) return;

        const varName = prompt('Enter variable name for the map:', 'payload') || 'payload';
        const delugeCode = window.jsonToDeluge(json, varName);

        const selection = editor.getSelection();
        const id = { major: 1, minor: 1 };
        const text = delugeCode;
        const op = { identifier: id, range: selection, text: text, forceMoveMarkers: true };
        editor.executeEdits("json-to-map", [op]);

        modal.style.display = 'none';
        log('Success', 'JSON converted and inserted.');
    });

    bind('clear-console', 'click', () => {
        document.getElementById('console-output').innerHTML = '';
    });

    document.querySelectorAll('.panel-header .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'IDE_CONSOLE_UPDATE') {
                log('Zoho', request.data);
            }
        });
    }
}

function log(type, message) {
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
    log('System', 'Pulling code...');
    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
        if (response && response.code) {
            editor.setValue(response.code);
            log('Success', 'Code pulled.');
        } else {
            log('Error', response?.error || 'No code found.');
        }
    });
}

function pushToZoho() {
    const code = editor.getValue();
    log('System', 'Pushing code...');
    chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (response) => {
        if (response && response.success) {
            log('Success', 'Code pushed.');
        } else {
            log('Error', response?.error || 'Push failed.');
        }
    });
}

function saveLocally() {
    const code = editor.getValue();
    chrome.storage.local.set({ 'saved_deluge_code': code }, () => {
        log('Success', 'Saved locally.');
    });
}

if (document.readyState === 'complete') {
    initEditor();
} else {
    window.addEventListener('load', initEditor);
}
