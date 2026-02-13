const editorCache = new WeakMap();

const Engines = {
    Monaco: {
        isAvailable: () => !!(window.monaco && (window.monaco.editor || window.monaco.languages)),
        getCode: () => {
            try {
                if (!window.monaco || !window.monaco.editor) return null;
                const models = window.monaco.editor.getModels();
                if (!models || models.length === 0) return null;
                // Prefer models with content and relevant language
                let model = models.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                if (!model) model = models.find(m => m.getValue().length > 0);
                if (!model) model = models[0];
                return model.getValue();
            } catch(e) { console.log('Monaco getCode error:', e); return null; }
        },
        setCode: (code) => {
            try {
                if (!window.monaco || !window.monaco.editor) return false;
                const models = window.monaco.editor.getModels();
                if (!models || models.length === 0) return false;
                let model = models.find(m => m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript');
                if (!model) model = models[0];
                model.setValue(code);
                return true;
            } catch(e) { console.log('Monaco setCode error:', e); return false; }
        }
    },
    Ace: {
        isAvailable: () => !!(document.querySelector('.ace_editor, .zace-editor, lyte-ace-editor') || (window.ace && window.ace.edit) || window.ZEditor || window.Zace),
        getCode: () => {
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
                        try {
                            let editor = editorCache.get(el);
                            if (!editor) {
                                editor = window.ace.edit(el);
                                editorCache.set(el, editor);
                            }
                            return editor.getValue();
                        } catch(e) {}
                    }
                }
                return null;
            } catch(e) { console.log('Ace getCode error:', e); return null; }
        },
        setCode: (code) => {
            try {
                if (window.ZEditor && window.ZEditor.setValue) { window.ZEditor.setValue(code); return true; }
                if (window.Zace && window.Zace.setValue) { window.Zace.setValue(code); return true; }

                const lyteAce = document.querySelector('lyte-ace-editor');
                if (lyteAce && lyteAce.getEditor) {
                    const ed = lyteAce.getEditor();
                    if (ed && ed.setValue) { ed.setValue(code); return true; }
                }

                const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
                let success = false;
                for (let el of aceEls) {
                    if (el.env && el.env.editor) { el.env.editor.setValue(code); success = true; }
                    else if (window.ace && window.ace.edit) {
                        try {
                            let editor = editorCache.get(el);
                            if (!editor) {
                                editor = window.ace.edit(el);
                                editorCache.set(el, editor);
                            }
                            editor.setValue(code);
                            success = true;
                        } catch(e) {}
                    }
                }
                return success;
            } catch(e) { console.log('Ace setCode error:', e); return false; }
        }
    },
    CodeMirror: {
        isAvailable: () => !!document.querySelector('.CodeMirror'),
        getCode: () => {
            try {
                const cmEls = document.querySelectorAll('.CodeMirror');
                for (let el of cmEls) if (el.CodeMirror) return el.CodeMirror.getValue();
                return null;
            } catch(e) { return null; }
        },
        setCode: (code) => {
            try {
                const cmEls = document.querySelectorAll('.CodeMirror');
                let success = false;
                for (let el of cmEls) if (el.CodeMirror) { el.CodeMirror.setValue(code); success = true; }
                return success;
            } catch(e) { return false; }
        }
    },
    Fallback: {
        isAvailable: () => !!(document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]')),
        getCode: () => {
            const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
            return el ? el.value || el.innerText : null;
        },
        setCode: (code) => {
            const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
            if (el) {
                el.value = code;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return false;
        }
    }
};

export function getEditorCode() {
    console.log('[ZohoIDE Bridge] Getting Code...');
    for (let engineName of Object.keys(Engines)) {
        const engine = Engines[engineName];
        if (engine.isAvailable()) {
            const code = engine.getCode();
            if (code !== null) {
                console.log('[ZohoIDE Bridge] Got code from:', engineName);
                return code;
            }
        }
    }
    return null;
}

export function setEditorCode(code) {
    console.log('[ZohoIDE Bridge] Setting Code...');
    for (let engineName of Object.keys(Engines)) {
        const engine = Engines[engineName];
        if (engine.isAvailable()) {
            if (engine.setCode(code)) {
                console.log('[ZohoIDE Bridge] Set code using:', engineName);
                return true;
            }
        }
    }
    return false;
}

export function extractNameFromCode(code) {
    if (!code) return null;
    // Match common Deluge function patterns: type name(params) { ... }
    // Support namespaces like standalone.test
    const match = code.match(/(?:void|string|int|decimal|list|map|bool|date|datetime|json|file)\s+([a-zA-Z0-9_.]+)\s*\(/i);
    if (match) return match[1];

    // Try to match function name from a line starting with the name followed by = {
    const simpleMatch = code.match(/^\s*([a-zA-Z0-9_.]+)\s*=\s*(?:Map|List|\{)/);
    if (simpleMatch) return simpleMatch[1];

    // Fallback for simple assignment
    const assignmentMatch = code.match(/^\s*([a-zA-Z0-9_.]+)\s*=\s*/);
    return assignmentMatch ? assignmentMatch[1] : null;
}
