/**
 * Monaco Loader Initialization
 */

console.log('[ZohoIDE] Loader starting...');

require.config({ paths: { 'vs': 'assets/monaco-editor/min/vs' } });

require(['vs/editor/editor.main'], function() {
    console.log('[ZohoIDE] Monaco Core loaded.');

    // Load language definition
    var script = document.createElement('script');
    script.src = 'deluge-lang.js';
    script.onload = function() {
        console.log('[ZohoIDE] deluge-lang.js loaded.');

        // Load main IDE logic
        var ideScript = document.createElement('script');
        ideScript.src = 'ide.js';
        document.body.appendChild(ideScript);
    };
    script.onerror = function() {
        console.error('[ZohoIDE] Failed to load deluge-lang.js');
    };
    document.body.appendChild(script);
});
