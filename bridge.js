// Bridge script injected into Zoho page to access Ace/CodeMirror/Monaco in Main World

(function() {
    // Prevent multiple injections if possible, but bridge.js is simple enough.

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FROM_EXTENSION') {
            const action = event.data.action;
            const code = getEditorCode();

            // If this frame doesn't have an editor and we're just getting code, don't respond
            // so other frames can.
            if (action === 'GET_ZOHO_CODE' && code === null) return;

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
        // 1. Monaco Editor (common in newer Zoho)
        if (window.monaco && window.monaco.editor) {
            const editors = window.monaco.editor.getModels();
            if (editors && editors.length > 0) {
                return editors[0].getValue();
            }
        }

        // 2. Ace Editor
        const aceEl = document.querySelector('.ace_editor');
        if (aceEl && aceEl.env && aceEl.env.editor) {
            return aceEl.env.editor.getValue();
        }
        // Alternative Ace detection
        if (window.ace && window.ace.edit) {
             // This is tricky without the element, but let's try finding the element
             const possibleAce = document.querySelector('[class*="ace_"]');
             if (possibleAce && possibleAce.env && possibleAce.env.editor) {
                 return possibleAce.env.editor.getValue();
             }
        }

        // 3. CodeMirror
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl && cmEl.CodeMirror) {
            return cmEl.CodeMirror.getValue();
        }

        // 4. Zoho's specific ZEditor or others
        if (window.ZEditor && window.ZEditor.getContent) {
            return window.ZEditor.getContent();
        }

        // 5. Fallback: Textareas with code-like content
        const textareas = document.querySelectorAll('textarea');
        for (let ta of textareas) {
            const val = ta.value;
            if (val && (val.includes('info ') || val.includes('zoho.') || val.includes('if(') || val.includes('return '))) {
                // If it's a hidden textarea used by an editor, it might still have the value
                return val;
            }
        }

        return null;
    }

    function setEditorCode(code) {
        // 1. Monaco Editor
        if (window.monaco && window.monaco.editor) {
            const editors = window.monaco.editor.getModels();
            if (editors && editors.length > 0) {
                editors[0].setValue(code);
                return true;
            }
        }

        // 2. Ace Editor
        const aceEl = document.querySelector('.ace_editor');
        if (aceEl && aceEl.env && aceEl.env.editor) {
            aceEl.env.editor.setValue(code);
            return true;
        }

        // 3. CodeMirror
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl && cmEl.CodeMirror) {
            cmEl.CodeMirror.setValue(code);
            return true;
        }

        // 4. ZEditor
        if (window.ZEditor && window.ZEditor.setContent) {
            window.ZEditor.setContent(code);
            return true;
        }

        // 5. Textareas
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

    // Console scraping - expanded selectors
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
                // Only send if it looks like actual output
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
