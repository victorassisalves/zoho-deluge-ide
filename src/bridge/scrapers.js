/**
 * Bridge Scrapers
 */

export function getEditorCode() {
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
            if (window.ace && window.ace.edit) {
                try { return window.ace.edit(aceEl).getValue(); } catch(e) {}
            }
        }
    } catch (e) {}
    try {
        const cmEls = document.querySelectorAll('.CodeMirror');
        for (let cmEl of cmEls) {
            if (cmEl.CodeMirror) return cmEl.CodeMirror.getValue();
        }
    } catch (e) {}
    return null;
}

export function getCreatorForms() {
    const forms = [];
    try {
        const els = document.querySelectorAll('.zc-form-name, .form-title, [data-zc-formname]');
        els.forEach(el => {
            const name = el.getAttribute('data-zc-formname') || el.innerText.trim();
            if (name && !forms.includes(name)) forms.push(name);
        });
    } catch (e) {}
    return forms;
}
