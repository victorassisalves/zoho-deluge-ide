const log = (...args) => console.log('[ZohoIDE Bridge Scraper]', ...args);

export function getEditorCode() {
    // 1. Monaco
    if (window.monaco && window.monaco.editor) {
        try {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                // Prefer models with content and relevant language
                let model = models.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                if (!model) model = models.find(m => m.getValue().length > 0);
                if (!model) model = models[0];
                return model.getValue();
            }
        } catch(e) { log('Monaco getCode error:', e); }
    }

    // 2. Ace
    try {
        // Try ZEditor/Zace first (common in Zoho Creator)
        if (window.ZEditor && window.ZEditor.getValue) return window.ZEditor.getValue();
        if (window.Zace && window.Zace.getValue) return window.Zace.getValue();

        // Try lyte-ace-editor component
        const lyteAce = document.querySelector('lyte-ace-editor');
        if (lyteAce && lyteAce.getEditor) {
            const ed = lyteAce.getEditor();
            if (ed && ed.getValue) return ed.getValue();
        }

        const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
        for (let el of aceEls) {
            if (el.env && el.env.editor) return el.env.editor.getValue();
            if (window.ace && window.ace.edit) {
                try { return window.ace.edit(el).getValue(); } catch(e) {}
            }
        }
    } catch(e) { log('Ace getCode error:', e); }

    // 3. CodeMirror
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let el of cmEls) if (el.CodeMirror) return el.CodeMirror.getValue();
    } catch(e) {}

    // 4. Fallback (Textarea/Input)
    try {
        const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
        if (el) return el.value || el.innerText;
    } catch(e) {}

    return null;
}
