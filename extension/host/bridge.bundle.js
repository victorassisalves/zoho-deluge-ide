(function() {

// --- detectors.js ---
function getZohoProduct() {
    const h = window.location.hostname;
    if (h.includes('crm')) return 'crm';
    if (h.includes('creator')) return 'creator';
    if (h.includes('books')) return 'books';
    if (h.includes('recruit')) return 'recruit';
    if (h.includes('flow')) return 'flow';
    return 'generic';
}


// --- scrapers.js ---
const log = (...args) => console.log('[ZohoIDE Bridge Scraper]', ...args);

function getEditorCode() {
    // 1. Monaco
    if (window.monaco && window.monaco.editor) {
        try {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                // Prefer models with content and relevant language
                let model = models.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                if (!model) model = models.find(m => m.getValue().length > 0);
                if (!model) model = models[0];
                return model.getValue();
            }
        } catch(e) { log('Monaco getCode error:', e); }
    }

    // 2. Ace
    try {
        // Try ZEditor/Zace first (common in Zoho Creator)
        if (window.ZEditor && window.ZEditor.getValue) return window.ZEditor.getValue();
        if (window.Zace && window.Zace.getValue) return window.Zace.getValue();

        // Try lyte-ace-editor component
        const lyteAce = document.querySelector('lyte-ace-editor');
        if (lyteAce && lyteAce.getEditor) {
            const ed = lyteAce.getEditor();
            if (ed && ed.getValue) return ed.getValue();
        }

        const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
        for (let el of aceEls) {
            if (el.env && el.env.editor) return el.env.editor.getValue();
            if (window.ace && window.ace.edit) {
                try { return window.ace.edit(el).getValue(); } catch(e) {}
            }
        }
    } catch(e) { log('Ace getCode error:', e); }

    // 3. CodeMirror
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let el of cmEls) if (el.CodeMirror) return el.CodeMirror.getValue();
    } catch(e) {}

    // 4. Fallback (Textarea/Input)
    try {
        const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
        if (el) return el.value || el.innerText;
    } catch(e) {}

    return null;
}


// --- actions/base-actions.js ---
const log = (...args) => console.log('[ZohoIDE Bridge Actions]', ...args);

function setEditorCode(code) {
    let success = false;

    // 1. Monaco
    try {
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                let model = models.find(m => m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript');
                if (!model) model = models[0];
                model.setValue(code);
                success = true;
            }
        }
    } catch (e) { log('Monaco set error', e); }
    if (success) return true;

    // 2. Ace
    try {
        if (window.ZEditor && window.ZEditor.setValue) { window.ZEditor.setValue(code); return true; }
        if (window.Zace && window.Zace.setValue) { window.Zace.setValue(code); return true; }

        const lyteAce = document.querySelector('lyte-ace-editor');
        if (lyteAce && lyteAce.getEditor) {
            const ed = lyteAce.getEditor();
            if (ed && ed.setValue) { ed.setValue(code); return true; }
        }

        const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
        for (let el of aceEls) {
            if (el.env && el.env.editor) { el.env.editor.setValue(code); success = true; }
            else if (window.ace && window.ace.edit) {
                try { window.ace.edit(el).setValue(code); success = true; } catch(e) {}
            }
        }
    } catch (e) { log('Ace set error', e); }
    if (success) return true;

    // 3. CodeMirror
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) { cmEl.CodeMirror.setValue(code); success = true; }
        }
    } catch (e) {}
    if (success) return true;

    // 4. Fallback
    try {
        const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor, textarea[id*="script"]');
        if (delugeEditor) {
            delugeEditor.value = code;
            if (delugeEditor.env && delugeEditor.env.editor) delugeEditor.env.editor.setValue(code);
            delugeEditor.dispatchEvent(new Event('input', { bubbles: true }));
            delugeEditor.dispatchEvent(new Event('change', { bubbles: true }));
            success = true;
        }
    } catch (e) {}

    return success;
}

function robustClick(el) {
    if (!el) return false;
    try {
        // Dispatch a sequence of events to mimic real user interaction
        const events = [
            { type: 'mousedown', cls: MouseEvent },
            { type: 'pointerdown', cls: PointerEvent },
            { type: 'mouseup', cls: MouseEvent },
            { type: 'pointerup', cls: PointerEvent },
            { type: 'click', cls: MouseEvent }
        ];

        events.forEach(({ type, cls }) => {
            try {
                const event = new cls(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    buttons: 1
                });
                el.dispatchEvent(event);
            } catch (e) {}
        });

        // Lyte button specific
        if (el.tagName && el.tagName.toLowerCase() === 'lyte-button' && el.executeAction) {
            try { el.executeAction('click', new MouseEvent('click')); } catch(e) {}
        }

        return true;
    } catch(e) {
        log('Click error:', e);
        return false;
    }
}

function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const els = document.querySelectorAll(sel);
            for (let el of els) {
                const isVisible = !!(el.offsetParent !== null || el.offsetWidth > 0);
                if (el && isVisible) {
                    if (robustClick(el)) return true;
                }
            }
        } catch(e) {}
    }
    return false;
}

function clickByText(type) {
    const candidates = document.querySelectorAll('button, input[type="button"], input[type="submit"], .lyte-button, [role="button"]');
    for (let el of candidates) {
        if (el.offsetParent === null && el.offsetWidth === 0) continue;
        const txt = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save' && (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('save & close'))) return robustClick(el);
        if (type === 'execute' && (txt === 'execute' || txt === 'run' || txt.includes('execute script'))) return robustClick(el);
    }
    return false;
}


// --- main.js ---




console.log('[ZohoIDE] Modular Bridge Loaded');

const selectors = {
    save: [
        'button[id="save_script"]', '#save_script', '#save_btn',
        '#crmsave', 'lyte-button[data-id="save"]', 'lyte-button[data-id="update"]',
        'lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]',
        'lyte-button[data-zcqa="functionSavev2"]', '.dxEditorPrimaryBtn',
        '.crm-save-btn', '.zc-save-btn', '.save-btn', '.zc-update-btn', '.save_btn',
        'input#saveBtn', 'input[value="Save"]', 'input[value="Update"]'
    ],
    execute: [
        'button[id="execute_script"]', '#execute_script', 'button[id="run_script"]', '#run_script',
        '#crmexecute', 'span[data-zcqa="delgv2execPlay"]', '.dx_execute_icon',
        '#runscript', '.zc-execute-btn', '.execute-btn',
        'lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]',
        '.lyte-button[data-id="execute"]', '.lyte-button[data-id="run"]',
        '.execute_btn', '#execute_btn', 'input#executeBtn',
        'input[value="Execute"]', 'input[value="Run"]'
    ]
};

window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
    const data = event.detail;
    if (!data || !data.action) return;

    let response = {};
    const { action, eventId } = data;

    if (action === 'GET_ZOHO_CODE') {
        response = { code: getEditorCode() };
    } else if (action === 'SET_ZOHO_CODE') {
        response = { success: setEditorCode(data.code) };
    } else if (action === 'SAVE_ZOHO_CODE') {
        response = { success: triggerAction('save') };
    } else if (action === 'EXECUTE_ZOHO_CODE') {
        response = { success: triggerAction('execute') };
    } else if (action === 'PING') {
        response = { status: 'PONG', product: getZohoProduct() };
    }

    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
        detail: { eventId, action, response }
    }));
});

function triggerAction(type) {
    let success = clickBySelectors(selectors[type]);
    if (!success) success = clickByText(type);
    return success;
}


})();