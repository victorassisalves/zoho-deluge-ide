// app/utils/logger.js
// Omniscient Telemetry System - The Interceptor

/**
 * Safely truncates strings within an object to prevent massive payload broadcasting.
 * @param {any} obj The object to truncate.
 * @param {number} maxLength Maximum string length before truncation.
 * @param {Set} seen Set of seen objects to prevent circular reference errors.
 * @returns {any} A deep copy of the object with truncated strings.
 */
function truncatePayload(obj, maxLength = 150, seen = new Set()) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return obj.length > maxLength ? obj.substring(0, maxLength) + '... [TRUNCATED]' : obj;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'function' || typeof obj === 'symbol') {
        return obj;
    }

    if (typeof obj === 'object') {
        if (seen.has(obj)) {
            return '[CIRCULAR]';
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            const arrRes = obj.map(item => truncatePayload(item, maxLength, seen));
            seen.delete(obj);
            return arrRes;
        }

        const result = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = truncatePayload(obj[key], maxLength, seen);
            }
        }
        seen.delete(obj);
        return result;
    }

    return String(obj);
}

/**
 * Detects the current execution environment.
 * @returns {string} The environment identifier.
 */
function detectEnvironment() {
    // 1. Service Worker Background (MV3)
    if (typeof window === 'undefined') {
        return '[BACKGROUND]';
    }

    // 2. Extension Pages (UI)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && window.location && window.location.protocol.startsWith('chrome-extension')) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'sidepanel') {
            return '[IDE_UI_PANEL]';
        }
        return '[IDE_UI_FULL]';
    }

    // 3. Content Scripts (Injected into Web Pages)
    return '[CONTENT_SCRIPT]';
}

const CURRENT_ENV = detectEnvironment();

export const Logger = {
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    /**
     * Internal generic logging function that handles dual-write.
     * @param {string} level The log level (INFO, WARN, ERROR, DEBUG).
     * @param {string} msgOrAction What is happening (legacy msg or new action).
     * @param {Array} args Additional details.
     */
    _log(level, msgOrAction, ...args) {
        let action = msgOrAction;
        let details = args.length === 1 && typeof args[0] === 'object' && args[0] !== null ? args[0] : (args.length > 0 ? args : {});

        const payload = {
            timestamp: Date.now(),
            level: level.toUpperCase(),
            origin: CURRENT_ENV,
            action: action,
            details: truncatePayload(details)
        };

        // 1. Native Console Logging
        let consoleMethod = 'log';
        if (level === 'WARN') consoleMethod = 'warn';
        if (level === 'ERROR') consoleMethod = 'error';
        if (level === 'DEBUG') consoleMethod = 'debug';

        console[consoleMethod](`[ZohoIDE] ${CURRENT_ENV} [${level}] ${action}`, ...args);

        // 2. Local Event Emission
        // Use legacy signature for compatibility if needed, or update consumers later
        this.emit(level.toLowerCase(), action);

        // 3. Broadcast to Telemetry System
        this._broadcast(payload);
    },

    _broadcast(payload) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
             // For all environments, we send to the background script
             // The background script will act as the central router and forward to IDEs
             chrome.runtime.sendMessage({ type: 'TELEMETRY_LOG', payload }).catch(() => {
                 // Ignore errors if no listeners are active or channel closed
             });
        }
    },

    info(action, ...args) {
        this._log('INFO', action, ...args);
    },

    warn(action, ...args) {
        this._log('WARN', action, ...args);
    },

    error(action, ...args) {
        this._log('ERROR', action, ...args);
    },

    debug(action, ...args) {
        this._log('DEBUG', action, ...args);
    },

    emit(type, msg) {
        this.listeners.forEach(fn => fn(type, msg));
    }
};
