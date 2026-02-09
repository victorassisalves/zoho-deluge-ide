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

    function triggerZohoAction(type) {
        let selectors = [];
        if (type === 'save') {
            selectors = [
                'button[id="save_script"]', '#save_script', '#save_btn',
                '#crmsave', 'lyte-button[data-id="save"]', 'lyte-button[data-id="update"]',
                'lyte-button[data-zcqa="functionSavev2"]', '.dxEditorPrimaryBtn',
                '.crm-save-btn', '.zc-save-btn', '.save-btn', '.save_btn',
                'input#saveBtn', 'input[value="Save"]', 'input[value="Update"]'
            ];
        } else if (type === 'execute') {
            selectors = [
                'button[id="execute_script"]', '#execute_script', 'button[id="run_script"]', '#run_script',
                '#crmexecute', 'span[data-zcqa="delgv2execPlay"]', '.dx_execute_icon',
                '#runscript', '.zc-execute-btn', '.execute-btn',
                '.lyte-button[data-id="execute"]', '.lyte-button[data-id="run"]',
                '.execute_btn', '#execute_btn', 'input#executeBtn',
                'input[value="Execute"]', 'input[value="Run"]'
            ];
        }

        for (let sel of selectors) {
            try {
                const el = document.querySelector(sel);
                if (el) { el.click(); return true; }
            } catch(e) {}
        }

        // Fallback: search by text
        const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], [role="button"]');
        for (let btn of buttons) {
            const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
            if (type === 'save') {
                if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close')) {
                    btn.click(); return true;
                }
            } else if (type === 'execute') {
                if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {
                    btn.click(); return true;
                }
            }
        }
        return false;
    }

    window.addEventListener('message', (event) => {
        let data = event.data;
        let isNewProtocol = false;

        if (typeof event.data === 'string' && event.data.startsWith('ZIDE_MSG:')) {
            try {
                data = JSON.parse(event.data.substring(9));
                isNewProtocol = true;
            } catch (e) { return; }
        }

        if (data && (data.type === 'FROM_EXTENSION' || data.source === 'EXTENSION')) {
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

            const payload = { type: 'FROM_PAGE', source: 'PAGE', action: action, response: response };
            if (isNewProtocol) {
                window.postMessage('ZIDE_MSG:' + JSON.stringify(payload), '*');
            } else {
                window.postMessage(payload, '*');
            }
        }
    });
})();
