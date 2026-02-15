import Logger from './logger.js';

export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, payload) {
        // Log the event emission
        Logger.debug(`[BUS] ⚡ ${event}`, payload);

        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        callbacks.forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                Logger.error(`Error in listener for event "${event}":`, error);
            }
        });
    }
}

const bus = new EventBus();
export default bus;
