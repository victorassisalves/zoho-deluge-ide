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
function getEditorCode() {
    if (window.monaco && window.monaco.editor) {
        const ms = window.monaco.editor.getModels();
        if (ms && ms.length > 0) return ms[0].getValue();
    }
    const ace = document.querySelectorAll('.ace_editor');
    for (let el of ace) {
        if (el.env && el.env.editor) return el.env.editor.getValue();
    }
    return null;
}


// --- actions/base-actions.js ---
function setEditorCode(code) {
    let success = false;
    try {
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) { models[0].setValue(code); success = true; }
        }
    } catch (e) {}
    if (success) return true;

    try {
        const aceEls = document.querySelectorAll('.ace_editor');
        for (let aceEl of aceEls) {
            if (aceEl.env && aceEl.env.editor) { aceEl.env.editor.setValue(code); success = true; }
            else if (window.ace && window.ace.edit) {
                try { window.ace.edit(aceEl).setValue(code); success = true; } catch(e) {}
            }
        }
    } catch (e) {}
    if (success) return true;

    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) { cmEl.CodeMirror.setValue(code); success = true; }
        }
    } catch (e) {}
    if (success) return true;

    try {
        const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor');
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
        el.click();
        // Dispatch additional events for frameworks like Lyte or React
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        return true;
    } catch(e) {
        return false;
    }
}

function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) { // Check if visible
                if (robustClick(el)) return true;
            }
        } catch(e) {}
    }
    return false;
}

function clickByText(type) {
    const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], [role="button"]');
    for (let btn of buttons) {
        if (btn.offsetParent === null) continue; // Skip hidden
        const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save') {
            if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close')) {
                if (robustClick(btn)) return true;
            }
        } else if (type === 'execute') {
            if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {
                if (robustClick(btn)) return true;
            }
        }
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