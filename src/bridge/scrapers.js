export function getEditorCode() {
    if (window.monaco && window.monaco.editor) {
        const ms = window.monaco.editor.getModels();
        if (ms && ms.length > 0) return ms[0].getValue();
    }
    const ace = document.querySelectorAll('.ace_editor');
    for (let el of ace) {
        if (el.env && el.env.editor) return el.env.editor.getValue();
    }
    return null;
}
