/**
 * Bridge Detectors
 * Identifies Zoho environments and editor types.
 */

export function getEditorType() {
    if (window.monaco && window.monaco.editor) return 'monaco';
    if (document.querySelectorAll('.ace_editor').length > 0) return 'ace';
    if (document.querySelectorAll('.CodeMirror').length > 0) return 'codemirror';
    if (document.querySelector('[id*="delugeEditor"], [id*="scriptEditor"], .deluge-editor')) return 'deluge';
    if (window.ZEditor) return 'zeditor';
    return null;
}

export function getZohoProduct() {
    const host = window.location.hostname;
    if (host.includes('crm')) return 'crm';
    if (host.includes('creator')) return 'creator';
    if (host.includes('books')) return 'books';
    if (host.includes('recruit')) return 'recruit';
    if (host.includes('inventory')) return 'inventory';
    return 'generic';
}
