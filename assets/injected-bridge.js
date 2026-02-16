/**
 * assets/injected-bridge.js
 * Injected into the Main World (Zoho Page) to access 'window.ace' and other protected globals.
 */
(function() {
    window.addEventListener('message', (event) => {
        // Ensure message is from trusted source (our extension)
        // We use a specific protocol signature
        if (!event.data || !event.data.type || !event.data.type.startsWith('ZOHO_IDE_')) return;

        if (event.data.type === 'ZOHO_IDE_PULL') {
            const selector = event.data.selector || '.ace_editor';
            const el = document.querySelector(selector);
            let code = "";

            if (el) {
                if (window.ace && window.ace.edit) {
                    const editor = window.ace.edit(el);
                    code = editor.getValue();
                } else if (el.CodeMirror) {
                    code = el.CodeMirror.getValue();
                } else {
                    code = el.innerText || el.value || "";
                }
            }

            window.postMessage({
                type: 'ZOHO_IDE_PULL_RESULT',
                code: code,
                reqId: event.data.reqId
            }, '*');
        }

        if (event.data.type === 'ZOHO_IDE_PUSH') {
            const selector = event.data.selector || '.ace_editor';
            const el = document.querySelector(selector);

            if (el) {
                if (window.ace && window.ace.edit) {
                    const editor = window.ace.edit(el);
                    editor.setValue(event.data.code);
                } else if (el.CodeMirror) {
                    el.CodeMirror.setValue(event.data.code);
                } else {
                    el.value = event.data.code;
                    el.innerText = event.data.code;
                }
            }
        }
    });
    console.log("[ZohoIDE] Main World Bridge Active");
})();
