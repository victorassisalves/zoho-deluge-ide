/**
 * src/core/connection.js
 * The Sentinel: Manages the lifecycle of the link between the IDE and the Zoho DOM.
 * Implements the Hybrid Polling/Observer pattern.
 */
import { eventBus as bus } from './bus.js';
import { EVENTS } from './events.js';
import { logger as Logger } from '../utils/logger.js'; // Using the standardized logger

class ConnectionSentinel {
    constructor() {
        this.activeEditor = null;
        this.strategy = null;
        this.pollInterval = null;
        this.observer = null;
        this.isConnected = false;
        this.observerTarget = null;
    }

    /**
     * Start the Sentinel with a specific strategy.
     * @param {Object} strategy - The strategy object (must have detect() method).
     */
    start(strategy) {
        this.strategy = strategy;
        Logger.info(`[Sentinel] Starting with strategy: ${strategy.name}`);
        this.enterPollingMode();
    }

    /**
     * State: Polling
     * Aggressively searches for the editor every 1s.
     */
    enterPollingMode() {
        if (this.isConnected) return;

        // Clear any existing poll to be safe
        if (this.pollInterval) clearInterval(this.pollInterval);

        Logger.debug("[Sentinel] Entering Polling Mode...");

        this.pollInterval = setInterval(() => {
            try {
                const editorElement = this.strategy.detect();
                if (editorElement) {
                    this.establishConnection(editorElement);
                }
            } catch (error) {
                Logger.error("[Sentinel] Detection error:", error);
            }
        }, 1000);
    }

    /**
     * Transition: Polling -> Connected
     */
    establishConnection(element) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;

        this.activeEditor = element;
        this.isConnected = true;
        this.observerTarget = element.parentElement || document.body;

        Logger.info("[Sentinel] Connection ESTABLISHED. Editor found.");

        // Notify the rest of the app
        bus.emit(EVENTS.CONNECTION.ACTIVE, {
            element: this.activeEditor,
            strategy: this.strategy.name
        });

        this.setupObserver();
    }

    /**
     * State: Observation
     * Watches the parent for the removal of the editor.
     */
    setupObserver() {
        if (this.observer) this.observer.disconnect();

        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check if our active editor was in the removed nodes
                    const removedNodes = Array.from(mutation.removedNodes);
                    if (removedNodes.includes(this.activeEditor)) {
                        this.handleDisconnect();
                        return; // Stop processing changes
                    }
                }
            }
        });

        // We observe the parent to catch the 'childList' removal event
        this.observer.observe(this.observerTarget, { childList: true });
    }

    /**
     * Transition: Connected -> Polling
     */
    handleDisconnect() {
        Logger.warn("[Sentinel] Connection LOST. Editor removed from DOM.");

        this.isConnected = false;
        this.activeEditor = null;

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        bus.emit(EVENTS.CONNECTION.LOST);

        // Auto-healing: immediately start searching again
        this.enterPollingMode();
    }

    /**
     * Full Shutdown
     */
    stop() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.observer) this.observer.disconnect();
        this.isConnected = false;
        this.activeEditor = null;
        Logger.info("[Sentinel] Service stopped.");
    }
}

export const connectionSentinel = new ConnectionSentinel();
