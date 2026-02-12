export function normalizeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        // Remove query params and fragments for keying
        return u.origin + u.pathname;
    } catch(e) {
        return url;
    }
}

export function getRenameKey(metadata) {
    if (!metadata) return 'unknown';
    const orgId = metadata.orgId || 'unknown';
    const system = metadata.system || 'unknown';
    const id = metadata.functionId || normalizeUrl(metadata.url);
    return `${orgId}:${system}:${id}`;
}

export function getDisplayName(tab, renames = {}) {
    const key = getRenameKey(tab);
    if (renames[key]) return renames[key];
    return tab.functionName || tab.title || 'Untitled';
}

export function bind(id, event, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
    return el;
}
