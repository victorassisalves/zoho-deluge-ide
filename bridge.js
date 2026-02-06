// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    console.log('[ZohoIDE] Bridge script initialized');

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FROM_EXTENSION') {
            const action = event.data.action;
            const code = getEditorCode();

            console.log('[ZohoIDE] Action received:', action, 'Editor found:', code !== null);

            let response = {};
            if (action === 'GET_ZOHO_CODE') {
                if (code !== null) {
                    response = { code: code };
                } else {
                    response = { error: 'No editor found in this frame' };
                }
            } else if (action === 'SET_ZOHO_CODE') {
                response = { success: setEditorCode(event.data.code) };
            }

            window.postMessage({ type: 'FROM_PAGE', action: action, response: response }, '*');
        }
    });

    function getEditorCode() {
        // 1. Monaco Editor
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    return models[0].getValue();
                }
            }
        } catch (e) {}

        // 2. Ace Editor - Common in Zoho
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) {
                    return aceEl.env.editor.getValue();
                }
                // Try to get from ace global if it exists
                if (window.ace && window.ace.edit) {
                    try {
                        const editor = window.ace.edit(aceEl);
                        return editor.getValue();
                    } catch(e) {}
                }
            }
        } catch (e) {}

        // 3. CodeMirror
        try {
            const cmEls = document.querySelectorAll('.CodeMirror');
            for (let cmEl of cmEls) {
                if (cmEl.CodeMirror) {
                    return cmEl.CodeMirror.getValue();
                }
            }
        } catch (e) {}

        // 4. Zoho Creator specific (sometimes custom)
        try {
            const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor');
            if (delugeEditor) {
                if (delugeEditor.value !== undefined) return delugeEditor.value;
                if (delugeEditor.env && delugeEditor.env.editor) return delugeEditor.env.editor.getValue();
            }
        } catch (e) {}

        // 5. ZEditor
        try {
            if (window.ZEditor && window.ZEditor.getContent) {
                return window.ZEditor.getContent();
            }
        } catch (e) {}

        // 6. Generic Textareas with Deluge content
        try {
            const textareas = document.querySelectorAll('textarea');
            for (let ta of textareas) {
                const val = ta.value;
                if (val && (val.includes('info ') || val.includes('zoho.') || val.includes('if(') || val.includes('return '))) {
                    return val;
                }
            }
        } catch (e) {}

        return null;
    }

    function setEditorCode(code) {
        let success = false;
        // 1. Monaco Editor
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                    models[0].setValue(code);
                    success = true;
                }
            }
        } catch (e) {}

        // 2. Ace Editor
        try {
            const aceEls = document.querySelectorAll('.ace_editor');
            for (let aceEl of aceEls) {
                if (aceEl.env && aceEl.env.editor) {
                    aceEl.env.editor.setValue(code);
                    success = true;
                } else if (window.ace && window.ace.edit) {
                    try {
                        const editor = window.ace.edit(aceEl);
                        editor.setValue(code);
                        success = true;
                    } catch(e) {}
                }
            }
        } catch (e) {}

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

        // 4. Zoho Creator specific
        try {
            const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor');
            if (delugeEditor) {
                delugeEditor.value = code;
                if (delugeEditor.env && delugeEditor.env.editor) {
                    delugeEditor.env.editor.setValue(code);
                }
                delugeEditor.dispatchEvent(new Event('input', { bubbles: true }));
                delugeEditor.dispatchEvent(new Event('change', { bubbles: true }));
                success = true;
            }
        } catch (e) {}

        // 5. ZEditor
        try {
            if (window.ZEditor && window.ZEditor.setContent) {
                window.ZEditor.setContent(code);
                success = true;
            }
        } catch (e) {}

        // 6. Textareas
        try {
            const textareas = document.querySelectorAll('textarea');
            for (let ta of textareas) {
                const val = ta.value;
                if (val && (val.includes('info ') || val.includes('zoho.') || val.includes('if(') || val.includes('return '))) {
                    ta.value = code;
                    ta.dispatchEvent(new Event('input', { bubbles: true }));
                    ta.dispatchEvent(new Event('change', { bubbles: true }));
                    success = true;
                }
            }
        } catch (e) {}

        return success;
    }

    // Console scraping
    setInterval(() => {
        try {
            const selectors = [
                '.console-output',
                '#console-result',
                '.builder-console-content',
                '.debugger-console',
                '[id*="console"]',
                '.output-container',
                '.deluge-console'
            ];

            for (let selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText && el.innerText.trim().length > 0) {
                    const text = el.innerText.trim();
                    if (text !== window._last_console_data) {
                        window._last_console_data = text;
                        window.postMessage({
                            type: 'FROM_PAGE',
                            action: 'ZOHO_CONSOLE_UPDATE',
                            data: text
                        }, '*');
                        break;
                    }
                }
            }
        } catch (e) {}
    }, 2000);
})();
