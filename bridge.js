// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    console.log('[ZohoIDE] Bridge initialized');

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

    function getProduct() {
        const url = window.location.href;
        if (url.includes('creator.zoho')) return 'creator';
        if (url.includes('crm.zoho')) return 'crm';
        if (url.includes('analytics.zoho')) return 'analytics';
        if (url.includes('books.zoho')) return 'books';
        return 'unknown';
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

    function triggerZohoAction(type) {
        const product = getProduct();
        console.log('[ZohoIDE] Triggering ' + type + ' for ' + product);

        let selectors = [];
        if (type === 'save') {
            if (product === 'creator') {
                selectors = ['lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]', 'lyte-button[data-id="save"]', 'lyte-button[data-id="update"]', '.zc-save-btn', '.zc-update-btn'];
            } else if (product === 'crm') {
                selectors = ['#crmsave', 'lyte-button[data-zcqa="save"]', 'lyte-button[data-id="save"]', '.crm-save-btn', 'input[value="Save"]'];
            }
            // Add global fallbacks
            selectors.push(...[
                'button[id="save_script"]', '#save_script', '#save_btn',
                'lyte-button[data-zcqa="functionSavev2"]', '.dxEditorPrimaryBtn',
                '.save-btn', '.save_btn', 'input#saveBtn'
            ]);
        } else if (type === 'execute') {
            if (product === 'creator') {
                selectors = ['lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]', 'span[data-zcqa="delgv2execPlay"]', '.zc-execute-btn'];
            } else if (product === 'crm') {
                selectors = ['#crmexecute', 'lyte-button[data-id="execute"]', 'lyte-button[data-id="run"]'];
            }
            // Add global fallbacks
            selectors.push(...[
                'button[id="execute_script"]', '#execute_script', 'button[id="run_script"]', '#run_script',
                '.dx_execute_icon', '#runscript', '.execute-btn', '.execute_btn', 'input#executeBtn'
            ]);
        }

        for (let sel of selectors) {
            try {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) { // Check if visible
                    console.log('[ZohoIDE] Found button via selector: ' + sel);
                    if (robustClick(el)) return true;
                }
            } catch(e) {}
        }

        // Fallback: search by text
        const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], [role="button"]');
        for (let btn of buttons) {
            if (btn.offsetParent === null) continue; // Skip hidden
            const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
            if (type === 'save') {
                if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close')) {
                    console.log('[ZohoIDE] Found button via text: ' + txt);
                    if (robustClick(btn)) return true;
                }
            } else if (type === 'execute') {
                if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {
                    console.log('[ZohoIDE] Found button via text: ' + txt);
                    if (robustClick(btn)) return true;
                }
            }
        }
        console.warn('[ZohoIDE] No ' + type + ' button found.');
        return false;
    }

    window.addEventListener('message', (event) => {
        let data;
        try {
            // Try parsing as JSON first
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            // Fallback for old ZIDE_MSG: prefix
            if (typeof event.data === 'string' && event.data.startsWith('ZIDE_MSG:')) {
                try {
                    data = JSON.parse(event.data.substring(9));
                } catch (e2) { return; }
            } else {
                return;
            }
        }

        // Only process requests from the extension/side-panel
        if (data && (data.type === 'FROM_EXTENSION' || data.source === 'EXTENSION' || data._zide_msg_) && data.source !== 'PAGE') {
            const action = data.action;
            let response = {};

            if (action === 'GET_ZOHO_CODE') {
                const code = getEditorCode();
                response = code !== null ? { code: code } : { error: 'No editor' };
            } else if (action === 'SET_ZOHO_CODE') {
                response = { success: setEditorCode(data.code) };
            } else if (action === 'SAVE_ZOHO_CODE') {
                response = { success: triggerZohoAction('save') };
            } else if (action === 'EXECUTE_ZOHO_CODE') {
                response = { success: triggerZohoAction('execute') };
            } else if (action === 'PING') {
                response = { status: 'PONG' };
            }

            const payload = {
                _zide_msg_: true,
                type: 'FROM_PAGE',
                source: 'PAGE',
                action: action,
                response: response
            };

            // Always send as JSON string to be safe with other listeners
            window.postMessage(JSON.stringify(payload), '*');
        }
    });
})();
