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
     * Extracts code from the editor instance.
     * Note: Accessing 'ace' or 'CodeMirror' globals requires this script
     * to run in the MAIN world (or have access to window object).
     */
    pull(element) {
        try {
            if (element.classList.contains('ace_editor')) {
                // Try global Ace first, then fallback to env attached to element
                const editor = window.ace ? window.ace.edit(element) : element.env?.editor;
                return editor ? editor.getValue() : element.innerText;
            }
            if (element.classList.contains('CodeMirror')) {
                // CodeMirror often attaches the instance to the DOM element property
                return element.CodeMirror ? element.CodeMirror.getValue() : element.innerText;
            }
            // Monaco fallback / standard text
            return element.innerText || "";
        } catch (error) {
            Logger.error("[GenericStrategy] Pull failed:", error);
            // Fallback to text content to avoid breaking the user experience
            return element.innerText || "";
        }
    },

    /**
     * Injects code into the editor.
     */
    push(element, code) {
        try {
            if (element.classList.contains('ace_editor')) {
                const editor = window.ace ? window.ace.edit(element) : element.env?.editor;
                if (editor) {
                    editor.setValue(code);
                    editor.clearSelection(); // Prevent annoying full-text selection
                }
            } else if (element.classList.contains('CodeMirror') && element.CodeMirror) {
                element.CodeMirror.setValue(code);
            } else {
                // Fallback: This usually won't trigger internal state updates in React/Vue apps
                // but is better than nothing for legacy forms.
                element.innerText = code;
            }
        } catch (error) {
            Logger.error("[GenericStrategy] Push failed:", error);
        }
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
    }
};
