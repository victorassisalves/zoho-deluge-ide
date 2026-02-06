// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    console.log('[ZohoIDE] Bridge script initialized');

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FROM_EXTENSION') {
            const action = event.data.action;
            const code = getEditorCode();

            if (action === 'GET_ZOHO_CODE' && code === null) {
                console.log('[ZohoIDE] GET_ZOHO_CODE: No editor found in this frame');
                return;
            }

            console.log('[ZohoIDE] Action received:', action, 'Editor found:', code !== null);

            let response = {};
            if (action === 'GET_ZOHO_CODE') {
                response = { code: code };
            } else if (action === 'SET_ZOHO_CODE') {
                response = { success: setEditorCode(event.data.code) };
            }

            window.postMessage({ type: 'FROM_PAGE', action: action, response: response }, '*');
        }
    });

    function getEditorCode() {
        // 1. Monaco Editor
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                return models[0].getValue();
            }
        }

        // 2. Ace Editor - Common in Zoho
        const aceEls = document.querySelectorAll('.ace_editor');
        for (let aceEl of aceEls) {
            if (aceEl.env && aceEl.env.editor) {
                return aceEl.env.editor.getValue();
            }
        }

        // 3. CodeMirror
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) {
                return cmEl.CodeMirror.getValue();
            }
        }

        // 4. Zoho Creator specific (sometimes custom)
        const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"]');
        if (delugeEditor) {
            if (delugeEditor.value) return delugeEditor.value;
            // Check if it's an Ace instance attached to it
            if (delugeEditor.env && delugeEditor.env.editor) return delugeEditor.env.editor.getValue();
        }

        // 5. ZEditor
        if (window.ZEditor && window.ZEditor.getContent) {
            return window.ZEditor.getContent();
        }

        // 6. Generic Textareas with Deluge content
        const textareas = document.querySelectorAll('textarea');
        for (let ta of textareas) {
            const val = ta.value;
            if (val && (val.includes('info ') || val.includes('zoho.') || val.includes('if(') || val.includes('return '))) {
                return val;
            }
        }

        return null;
    }

    function setEditorCode(code) {
        // 1. Monaco Editor
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                models[0].setValue(code);
                return true;
            }
        }

        // 2. Ace Editor
        const aceEls = document.querySelectorAll('.ace_editor');
        for (let aceEl of aceEls) {
            if (aceEl.env && aceEl.env.editor) {
                aceEl.env.editor.setValue(code);
                return true;
            }
        }

        // 3. CodeMirror
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) {
                cmEl.CodeMirror.setValue(code);
                return true;
            }
        }

        // 4. Zoho Creator specific
        const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"]');
        if (delugeEditor) {
            delugeEditor.value = code;
            if (delugeEditor.env && delugeEditor.env.editor) {
                delugeEditor.env.editor.setValue(code);
            }
            delugeEditor.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }

        // 5. ZEditor
        if (window.ZEditor && window.ZEditor.setContent) {
            window.ZEditor.setContent(code);
            return true;
        }

        // 6. Textareas
        const textareas = document.querySelectorAll('textarea');
        for (let ta of textareas) {
            const val = ta.value;
            if (val && (val.includes('info ') || val.includes('zoho.') || val.includes('if(') || val.includes('return '))) {
                ta.value = code;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }

    // Console scraping
    setInterval(() => {
        const selectors = [
            '.console-output',
            '#console-result',
            '.builder-console-content',
            '.debugger-console',
            '[id*="console"]',
            '.output-container'
        ];

        for (let selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText && el.innerText.trim().length > 0) {
                if (el.innerText !== window._last_console_data) {
                    window._last_console_data = el.innerText;
                    window.postMessage({
                        type: 'FROM_PAGE',
                        action: 'ZOHO_CONSOLE_UPDATE',
                        data: el.innerText
                    }, '*');
                    break;
                }
            }
        }
    }, 2000);
})();
