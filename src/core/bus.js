import { logger as Logger } from '../utils/logger.js';
class EventBus {
    constructor() { this.listeners = {}; }
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== callback);
    }
    emit(event, payload) {
        Logger.debug(`[BUS] ⚡ ${event}`, payload);
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(payload); } catch (e) { Logger.error(`Error in listener for ${event}`, e); }
            });
        }
    }
}
export const eventBus = new EventBus();
