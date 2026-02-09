(function() {
    console.log('[ZohoIDE] Bridge Initialized');

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
            }
        } catch (e) {}
        return null;
    }

    function setEditorCode(code) {
        try {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) { models[0].setValue(code); return true; }
            }
        } catch (e) {}
        return false;
    }

    window.addEventListener('message', (event) => {
        if (typeof event.data !== 'string' || !event.data.startsWith('ZIDE_MSG:')) return;
        try {
            const data = JSON.parse(event.data.substring(9));
            if (data.zide_source === 'EXTENSION') {
                const action = data.action;
                let response = {};
                if (action === 'GET_ZOHO_CODE') {
                    const code = getEditorCode();
                    response = code !== null ? { code: code } : { error: 'No editor' };
                } else if (action === 'SET_ZOHO_CODE') {
                    response = { success: setEditorCode(data.code) };
                }
                window.postMessage('ZIDE_MSG:' + JSON.stringify({ zide_source: 'PAGE', action: action, response: response }), '*');
            }
        } catch (e) {}
    });
})();
