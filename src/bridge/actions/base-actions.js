export function setEditorCode(code) {
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

export function robustClick(el) {
    if (!el) return false;
    try {
        el.click();
        // Dispatch additional events for frameworks like Lyte or React
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        return true;
    } catch(e) {
        return false;
    }
}

export function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) { // Check if visible
                if (robustClick(el)) return true;
            }
        } catch(e) {}
    }
    return false;
}

export function clickByText(type) {
    const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], [role="button"]');
    for (let btn of buttons) {
        if (btn.offsetParent === null) continue; // Skip hidden
        const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save') {
            if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close')) {
                if (robustClick(btn)) return true;
            }
        } else if (type === 'execute') {
            if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {
                if (robustClick(btn)) return true;
            }
        }
    }
    return false;
}
