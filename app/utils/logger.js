
// app/utils/logger.js
export const Logger = {
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    info(msg, ...args) {
        console.log('[ZohoIDE] ' + msg, ...args);
        this.emit('info', msg);
    },

    warn(msg, ...args) {
        console.warn('[ZohoIDE] ' + msg, ...args);
        this.emit('warning', msg);
    },

    error(msg, ...args) {
        console.error('[ZohoIDE] ' + msg, ...args);
        this.emit('error', msg);
    },

    debug(msg, ...args) {
        console.debug('[ZohoIDE] ' + msg, ...args);
        // Debug logs might be too noisy for the UI, but we can emit them as 'system' or similar
        this.emit('system', msg);
    },

    emit(type, msg) {
        this.listeners.forEach(fn => fn(type, msg));
    }
};
