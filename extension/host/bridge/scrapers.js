export function getEditorCode() {
    console.log('[ZohoIDE] Scraper: Starting search...');

    // 1. Monaco (Standard)
    try {
        if (window.monaco && window.monaco.editor) {
            const ms = window.monaco.editor.getModels();
            if (ms && ms.length > 0) {
                // Find model with content
                const validModel = ms.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                if (validModel) {
                    console.log('[ZohoIDE] Scraper: Found Monaco Model');
                    return validModel.getValue();
                }
                // Fallback to first model
                if (ms[0].getValue()) return ms[0].getValue();
            }
        }
    } catch (e) { console.warn('[ZohoIDE] Scraper Monaco Error:', e); }

    // 2. Zoho Creator Specific (ZEditor / Zace)
    try {
        if (window.ZEditor && typeof window.ZEditor.getValue === 'function') {
            console.log('[ZohoIDE] Scraper: Found ZEditor');
            return window.ZEditor.getValue();
        }
        if (window.Zace && typeof window.Zace.getValue === 'function') {
            console.log('[ZohoIDE] Scraper: Found Zace');
            return window.Zace.getValue();
        }
        if (window.delugeEditor && typeof window.delugeEditor.getValue === 'function') {
            console.log('[ZohoIDE] Scraper: Found delugeEditor global');
            return window.delugeEditor.getValue();
        }
    } catch (e) { console.warn('[ZohoIDE] Scraper Creator Globals Error:', e); }

    // 3. Ace Editor DOM traversal (Deep Search)
    try {
        const aceEls = document.querySelectorAll('.ace_editor, .zace-editor, lyte-ace-editor');
        console.log('[ZohoIDE] Scraper: Found Ace Elements:', aceEls.length);

        for (let el of aceEls) {
            // Check direct env
            if (el.env && el.env.editor) {
                console.log('[ZohoIDE] Scraper: Found Ace via env');
                return el.env.editor.getValue();
            }
            // Check window.ace.edit
            if (window.ace && window.ace.edit) {
                try {
                    const editor = window.ace.edit(el);
                    if (editor && editor.getValue()) {
                        console.log('[ZohoIDE] Scraper: Found Ace via edit()');
                        return editor.getValue();
                    }
                } catch(e) {}
            }
        }
    } catch (e) { console.warn('[ZohoIDE] Scraper Ace Error:', e); }

    // 4. Fallback Textareas (Hidden or Visible)
    try {
        const textareas = document.querySelectorAll('textarea[id*="script"], textarea[class*="deluge"], textarea[name*="script"]');
        for (let ta of textareas) {
            if (ta.value && ta.value.length > 10) {
                console.log('[ZohoIDE] Scraper: Found Textarea Fallback');
                return ta.value;
            }
        }
    } catch (e) {}

    console.warn('[ZohoIDE] Scraper: No code found.');
    return null;
}
