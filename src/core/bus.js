/**
 * src/core/bus.js
 * Central Event Bus - Universal Export Pattern
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }

    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }
}

const bus = new EventBus();

// Export as Named
export { bus, bus as eventBus };
// Export as Default
export default bus;
