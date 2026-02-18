const log = (...args) => console.log('[ZohoIDE Bridge Actions]', ...args);

export function setEditorCode(code) {
    let success = false;

    // 1. Monaco
    try {
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                let model = models.find(m => m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript');
                if (!model) model = models[0];
                model.setValue(code);
                success = true;
            }
        }
    } catch (e) { log('Monaco set error', e); }
    if (success) return true;

    // 2. Ace
    try {
        if (window.ZEditor && window.ZEditor.setValue) { window.ZEditor.setValue(code); return true; }
        if (window.Zace && window.Zace.setValue) { window.Zace.setValue(code); return true; }

        const lyteAce = document.querySelector('lyte-ace-editor');
        if (lyteAce && lyteAce.getEditor) {
            const ed = lyteAce.getEditor();
            if (ed && ed.setValue) { ed.setValue(code); return true; }
        }

        const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
        for (let el of aceEls) {
            if (el.env && el.env.editor) { el.env.editor.setValue(code); success = true; }
            else if (window.ace && window.ace.edit) {
                try { window.ace.edit(el).setValue(code); success = true; } catch(e) {}
            }
        }
    } catch (e) { log('Ace set error', e); }
    if (success) return true;

    // 3. CodeMirror
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) { cmEl.CodeMirror.setValue(code); success = true; }
        }
    } catch (e) {}
    if (success) return true;

    // 4. Fallback
    try {
        const delugeEditor = document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor, textarea[id*="script"]');
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

export function robustClick(el) {
    if (!el) return false;
    try {
        // Dispatch a sequence of events to mimic real user interaction
        const events = [
            { type: 'mousedown', cls: MouseEvent },
            { type: 'pointerdown', cls: PointerEvent },
            { type: 'mouseup', cls: MouseEvent },
            { type: 'pointerup', cls: PointerEvent },
            { type: 'click', cls: MouseEvent }
        ];

        events.forEach(({ type, cls }) => {
            try {
                const event = new cls(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    buttons: 1
                });
                el.dispatchEvent(event);
            } catch (e) {}
        });

        // Lyte button specific
        if (el.tagName && el.tagName.toLowerCase() === 'lyte-button' && el.executeAction) {
            try { el.executeAction('click', new MouseEvent('click')); } catch(e) {}
        }

        return true;
    } catch(e) {
        log('Click error:', e);
        return false;
    }
}

export function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const els = document.querySelectorAll(sel);
            for (let el of els) {
                const isVisible = !!(el.offsetParent !== null || el.offsetWidth > 0);
                if (el && isVisible) {
                    if (robustClick(el)) return true;
                }
            }
        } catch(e) {}
    }
    return false;
}

export function clickByText(type) {
    const candidates = document.querySelectorAll('button, input[type="button"], input[type="submit"], .lyte-button, [role="button"]');
    for (let el of candidates) {
        if (el.offsetParent === null && el.offsetWidth === 0) continue;
        const txt = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save' && (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('save & close'))) return robustClick(el);
        if (type === 'execute' && (txt === 'execute' || txt === 'run' || txt.includes('execute script'))) return robustClick(el);
    }
    return false;
}
