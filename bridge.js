// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    console.log('[ZohoIDE] Bridge initialized');

    function getEditorCode() {
        // 1. Monaco
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    // Search for the model that actually has code and isn't just a config/internal model
                    let bestModel = models.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                    if (!bestModel) bestModel = models.find(m => m.getValue().length > 0);
                    if (!bestModel) bestModel = models[0];
                    return bestModel.getValue();
                }
            }
        } catch (e) {}

        // 2. Ace
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) return aceEl.env.editor.getValue();
                if (window.ace && window.ace.edit) {
                    try {
                        const ed = window.ace.edit(aceEl);
                        if (ed) return ed.getValue();
                    } catch(e) {}
                }
            }
        } catch (e) {}

        // 3. CodeMirror
        try {
            const cmEls = document.querySelectorAll('.CodeMirror');
            for (let cmEl of cmEls) {
                if (cmEl.CodeMirror) return cmEl.CodeMirror.getValue();
            }
        } catch (e) {}

        // 4. Zoho Specific & Fallbacks
        try {
            const selectors = [
                '.monaco-editor',
                '.ace_editor',
                '[id*="delugeEditor"]',
                '[id*="scriptEditor"]',
                '[id*="formulaEditor"]',
                '.deluge-editor',
                '.zace-editor',
                '#delugeEditor'
            ];
            for (let sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    if (el.env && el.env.editor) return el.env.editor.getValue();
                    if (el.value !== undefined && el.tagName === 'TEXTAREA') return el.value;
                }
            }
        } catch (e) {}

        return null;
    }

    function setEditorCode(code) {
        let success = false;

        // 1. Monaco
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    let bestModel = models.find(m => m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript');
                    if (!bestModel) bestModel = models[0];
                    bestModel.setValue(code);
                    success = true;
                }
            }
        } catch (e) {}
        if (success) return true;

        // 2. Ace
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) {
                    aceEl.env.editor.setValue(code);
                    success = true;
                } else if (window.ace && window.ace.edit) {
                    try {
                        const ed = window.ace.edit(aceEl);
                        if (ed) { ed.setValue(code); success = true; }
                    } catch(e) {}
                }
            }
        } catch (e) {}
        if (success) return true;

        // 3. CodeMirror
        try {
            const cmEls = document.querySelectorAll('.CodeMirror');
            for (let cmEl of cmEls) {
                if (cmEl.CodeMirror) {
                    cmEl.CodeMirror.setValue(code);
                    success = true;
                }
            }
        } catch (e) {}
        if (success) return true;

        // 4. Fallbacks
        try {
            const selectors = [
                '[id*="delugeEditor"]',
                '[id*="scriptEditor"]',
                '.deluge-editor',
                '#delugeEditor'
            ];
            for (let sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    if (el.env && el.env.editor) {
                        el.env.editor.setValue(code);
                        success = true;
                    } else if (el.value !== undefined) {
                        el.value = code;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        success = true;
                    }
                }
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
        if (url.includes('flow.zoho')) return 'flow';
        return 'unknown';
    }

    function robustClick(el) {
        if (!el) return false;
        try {
            // Standard click
            el.click();

            // Dispatch variety of events to satisfy different frameworks (Lyte, Ember, React)
            const events = [
                ['mousedown', MouseEvent],
                ['mouseup', MouseEvent],
                ['click', MouseEvent],
                ['pointerdown', PointerEvent],
                ['pointerup', PointerEvent]
            ];

            events.forEach(([type, Cls]) => {
                el.dispatchEvent(new Cls(type, { bubbles: true, cancelable: true, view: window }));
            });

            return true;
        } catch(e) {
            console.error('[ZohoIDE] click error:', e);
            return false;
        }
    }

    function triggerZohoAction(type) {
        const product = getProduct();
        console.log('[ZohoIDE] Triggering ' + type + ' for ' + product);

        let selectors = [];
        if (type === 'save') {
            if (product === 'flow') {
                selectors = ['input[value="Save"].zf-green-btn', 'input[value="Save"]', '.zf-green-btn'];
            } else if (product === 'creator') {
                selectors = ['lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]', '.zc-save-btn', '.zc-update-btn'];
            } else if (product === 'crm') {
                selectors = ['#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'];
            }
            // Global Fallbacks
            selectors.push(...['#save_script', '#save_btn', 'input[value="Save"]', 'input[value="Update"]', 'button:contains("Save")']);
        } else if (type === 'execute') {
            if (product === 'flow') {
                selectors = ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]'];
            } else if (product === 'creator') {
                selectors = ['lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]', 'span[data-zcqa="delgv2execPlay"]', '.zc-execute-btn'];
            } else if (product === 'crm') {
                selectors = ['#crmexecute', 'lyte-button[data-id="execute"]'];
            }
            // Global Fallbacks
            selectors.push(...['#execute_script', '#run_script', 'input[value="Execute"]', 'input[value="Run"]']);
        }

        for (let sel of selectors) {
            try {
                const els = document.querySelectorAll(sel);
                for (let el of els) {
                    if (el && (el.offsetParent !== null || el.offsetWidth > 0)) { // Check if visible
                        console.log('[ZohoIDE] Found button via selector: ' + sel);
                        if (robustClick(el)) return true;
                    }
                }
            } catch(e) {}
        }

        // Fallback: search by text across ALL clickable elements
        const candidates = document.querySelectorAll('button, input[type="button"], input[type="submit"], .lyte-button, a.btn, [role="button"], span, div');
        for (let el of candidates) {
            if (el.offsetParent === null && el.offsetWidth === 0) continue;
            const txt = (el.innerText || el.textContent || el.value || '').toLowerCase().trim();
            if (type === 'save' && (txt === 'save' || txt === 'update' || txt.includes('save script'))) {
                console.log('[ZohoIDE] Found button via text: ' + txt);
                if (robustClick(el)) return true;
            } else if (type === 'execute' && (txt === 'execute' || txt === 'run' || txt.includes('execute script'))) {
                console.log('[ZohoIDE] Found button via text: ' + txt);
                if (robustClick(el)) return true;
            }
        }

        console.warn('[ZohoIDE] No ' + type + ' button found.');
        return false;
    }

    window.addEventListener('message', (event) => {
        let data;
        try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            if (typeof event.data === 'string' && event.data.startsWith('ZIDE_MSG:')) {
                try { data = JSON.parse(event.data.substring(9)); } catch (e2) { return; }
            } else { return; }
        }

        if (data && (data.source === 'EXTENSION' || data._zide_msg_) && data.source !== 'PAGE') {
            const action = data.action;
            let response = {};

            if (action === 'GET_ZOHO_CODE') {
                const code = getEditorCode();
                response = code !== null ? { code: code } : { error: 'No editor found' };
            } else if (action === 'SET_ZOHO_CODE') {
                response = { success: setEditorCode(data.code) };
            } else if (action === 'SAVE_ZOHO_CODE') {
                response = { success: triggerZohoAction('save') };
            } else if (action === 'EXECUTE_ZOHO_CODE') {
                response = { success: triggerZohoAction('execute') };
            } else if (action === 'PING') {
                response = { status: 'PONG', product: getProduct() };
            }

            window.postMessage(JSON.stringify({
                _zide_msg_: true,
                type: 'FROM_PAGE',
                source: 'PAGE',
                action: action,
                response: response
            }), '*');
        }
    });
})();
