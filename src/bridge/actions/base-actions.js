/**
 * Base Actions for Bridge
 */

export function setEditorCode(code) {
    let success = false;
    try {
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) { models[0].setValue(code); success = true; }
        }
    } catch (e) {}
    try {
        const aceEls = document.querySelectorAll('.ace_editor');
        for (let aceEl of aceEls) {
            if (aceEl.env && aceEl.env.editor) { aceEl.env.editor.setValue(code); success = true; }
            else if (window.ace && window.ace.edit) {
                try { window.ace.edit(aceEl).setValue(code); success = true; } catch(e) {}
            }
        }
    } catch (e) {}
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) { cmEl.CodeMirror.setValue(code); success = true; }
        }
    } catch (e) {}
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

export function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el) { el.click(); return true; }
        } catch(e) {}
    }
    return false;
}

export function clickByText(type) {
    const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], [role="button"]');
    for (let btn of buttons) {
        const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save') {
            if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close') || txt.includes('save and close')) {
                btn.click(); return true;
            }
        }
        if (type === 'execute') {
            if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script') || txt.includes('save & execute') || txt.includes('save and execute')) {
                btn.click(); return true;
            }
        }
    }
    return false;
}
