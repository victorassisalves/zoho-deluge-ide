/**
 * src/bridge/strategies/generic.js
 * A unified interface for standard Zoho editors (Ace, CodeMirror, Monaco).
 */
import { logger as Logger } from '../../utils/logger.js';

export const genericStrategy = {
    name: 'GenericStrategy',

    /**
     * Detects standard editor classes in the DOM.
     * @returns {HTMLElement|null} The editor container
     */
    detect() {
        return document.querySelector('.ace_editor') ||
               document.querySelector('.CodeMirror') ||
               document.querySelector('.monaco-editor');
    },

    /**
     * Extracts code from the editor instance via Main World Bridge.
     * @param {HTMLElement} element
     * @returns {string} The code (synchronous best effort, or async via promise handled by caller?)
     * Note: This architecture expects sync return currently.
     * But we need async postMessage.
     *
     * HACK: For now, we return innerText as a fallback while triggering the async pull.
     * A better solution would be to make the whole Pull chain async.
     */
    pull(element) {
        // Send request to main world
        const reqId = Date.now().toString();

        // Use a Promise-based approach if the caller supports it?
        // But BridgeManager.handlePull expects a return value immediately for SET_VALUE event.
        // We will return innerText as a fallback, but also dispatch the request.

        window.postMessage({
            type: 'ZOHO_IDE_PULL',
            selector: this._getSelector(element),
            reqId: reqId
        }, '*');

        // We listen for the result once
        return new Promise((resolve) => {
            const handler = (event) => {
                if (event.data && event.data.type === 'ZOHO_IDE_PULL_RESULT' /* && event.data.reqId === reqId */) {
                    window.removeEventListener('message', handler);
                    resolve(event.data.code);
                }
            };
            window.addEventListener('message', handler);

            // Timeout fallback
            setTimeout(() => {
                window.removeEventListener('message', handler);
                resolve(element.innerText || ""); // Fallback
            }, 1000);
        });
    },

    /**
     * Injects code into the editor via Main World Bridge.
     */
    push(element, code) {
        window.postMessage({
            type: 'ZOHO_IDE_PUSH',
            selector: this._getSelector(element),
            code: code
        }, '*');
    },

    /**
     * Heuristic execution: Finds and clicks the "Run" or "Save" button.
     */
    execute() {
        try {
            // Broad query for actionable elements
            const candidates = document.querySelectorAll('button, input[type="button"], .button, [role="button"]');
            const keywords = ['run', 'execute', 'save', 'update', 'submit'];

            for (const btn of candidates) {
                const text = (btn.innerText || btn.value || '').toLowerCase();

                // Check if any keyword is present
                if (keywords.some(k => text.includes(k))) {
                    Logger.info(`[GenericStrategy] Triggering execute on button: "${text}"`);
                    btn.click();
                    return true;
                }
            }
            Logger.warn("[GenericStrategy] No execution button found.");
            return false;
        } catch (error) {
            Logger.error("[GenericStrategy] Execute failed:", error);
            return false;
        }
    },

    _getSelector(element) {
        if (element.id) return '#' + element.id;
        if (element.classList.contains('ace_editor')) return '.ace_editor';
        if (element.classList.contains('CodeMirror')) return '.CodeMirror';
        return '.monaco-editor'; // Fallback
    }
};
