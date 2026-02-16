/**
 * src/content-loader.js
 * Loader script for Content Scripts to enable ES Modules.
 * Injected by manifest.json -> content_scripts.
 */
(async () => {
    try {
        const src = chrome.runtime.getURL('src/main.js');
        // Dynamic import() allows loading ES modules in content scripts
        await import(src);
    } catch (e) {
        console.error("[ZohoIDE] Failed to load main module:", e);
    }
})();
