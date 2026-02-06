// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    console.log('[ZohoIDE] Bridge script initialized');

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FROM_EXTENSION') {
            const action = event.data.action;
            let response = {};

            if (action === 'GET_ZOHO_CODE') {
                const code = getEditorCode();
                if (code !== null) {
                    response = { code: code };
                } else {
                    response = { error: 'No editor found in this frame' };
                }
            } else if (action === 'SET_ZOHO_CODE') {
                response = { success: setEditorCode(event.data.code) };
            } else if (action === 'SAVE_ZOHO_CODE') {
                response = { success: triggerZohoAction('save') };
            } else if (action === 'EXECUTE_ZOHO_CODE') {
                response = { success: triggerZohoAction('execute') };
            }

            window.postMessage({ type: 'FROM_PAGE', action: action, response: response }, '*');
        }
    });

    function getEditorCode() {
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) return models[0].getValue();
            }
        } catch (e) {}
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) return aceEl.env.editor.getValue();
                if (window.ace && window.ace.edit) {
                    try { return window.ace.edit(aceEl).getValue(); } catch(e) {}
                }
            }
        } catch (e) {}
        try {
            const cmEls = document.querySelectorAll('.CodeMirror');
            for (let cmEl of cmEls) {
                if (cmEl.CodeMirror) return cmEl.CodeMirror.getValue();
            }
        } catch (e) {}
        try {
            const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor');
            if (delugeEditor) {
                if (delugeEditor.value !== undefined) return delugeEditor.value;
                if (delugeEditor.env && delugeEditor.env.editor) return delugeEditor.env.editor.getValue();
            }
        } catch (e) {}
        try {
            if (window.ZEditor && window.ZEditor.getContent) return window.ZEditor.getContent();
        } catch (e) {}
        return null;
    }

    function setEditorCode(code) {
        let success = false;
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) { models[0].setValue(code); success = true; }
            }
        } catch (e) {}
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) { aceEl.env.editor.setValue(code); success = true; }
                else if (window.ace && window.ace.edit) {
                    try { window.ace.edit(aceEl).setValue(code); success = true; } catch(e) {}
                }
            }
        } catch (e) {}
        try {
            const cmEls = document.querySelectorAll('.CodeMirror');
            for (let cmEl of cmEls) {
                if (cmEl.CodeMirror) { cmEl.CodeMirror.setValue(code); success = true; }
            }
        } catch (e) {}
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

    function triggerZohoAction(type) {
        let selectors = [];
        if (type === 'save') {
            selectors = [
                'button[id="save_script"]',
                '.save-btn',
                '#save-btn',
                '.zc-save-btn',
                '.lyte-button[data-id="save"]',
                '.save_btn',
                '#save_btn'
            ];
        } else if (type === 'execute') {
            selectors = [
                'button[id="execute_script"]',
                '.execute-btn',
                '#execute-btn',
                '.zc-execute-btn',
                '.lyte-button[data-id="execute"]',
                '.execute_btn',
                '#execute_btn'
            ];
        }

        for (let sel of selectors) {
            const el = document.querySelector(sel);
            if (el) { el.click(); return true; }
        }

        // Fallback: search by text
        const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"]');
        for (let btn of buttons) {
            const txt = (btn.innerText || btn.value || '').toLowerCase().trim();
            if (type === 'save' && (txt === 'save' || txt === 'update')) {
                btn.click(); return true;
            }
            if (type === 'execute' && (txt.includes('execute') || txt.includes('run'))) {
                btn.click(); return true;
            }
        }
        return false;
    }

    // Console scraping
    setInterval(() => {
        try {
            const selectors = ['.console-output', '#console-result', '.builder-console-content', '.debugger-console', '[id*="console"]', '.output-container', '.deluge-console'];
            for (let selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText && el.innerText.trim().length > 0) {
                    const text = el.innerText.trim();
                    if (text !== window._last_console_data) {
                        window._last_console_data = text;
                        window.postMessage({ type: 'FROM_PAGE', action: 'ZOHO_CONSOLE_UPDATE', data: text }, '*');
                        break;
                    }
                }
            }
        } catch (e) {}
    }, 2000);
})();
