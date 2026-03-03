// app/utils/logger.js

// Generate a unique instance ID for this context
const INSTANCE_ID = Math.random().toString(36).substring(2, 15);

// Determine execution context origin
let ORIGIN = '[UNKNOWN]';
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    if (typeof window === 'undefined') {
        ORIGIN = '[BACKGROUND]';
    } else if (window.location && (window.location.pathname.includes('popup.html') || window.location.pathname.includes('index.html'))) {
        ORIGIN = '[IDE_UI]';
    } else {
        ORIGIN = '[CONTENT_SCRIPT]';
    }
} else if (typeof window !== 'undefined') {
    ORIGIN = window.parent !== window ? '[BRIDGE_IFRAME]' : '[BRIDGE_PAGE]';
}

// Initialize Telemetry Broadcast Channel
let telemetryChannel;
try {
    telemetryChannel = new BroadcastChannel('zoho_ide_telemetry');
} catch (e) {
    console.warn('BroadcastChannel not supported for telemetry', e);
}

const truncateArg = (arg) => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object' && arg !== null) {
        try {
            const str = JSON.stringify(arg);
            return str.length > 500 ? str.substring(0, 500) + '...' : str;
        } catch (e) {
            return '[Unserializable Object]';
        }
    }
    return arg;
};

const broadcastTelemetry = (level, msg, args) => {
    if (!telemetryChannel) return;

    try {
        const safeArgs = args.map(truncateArg);
        telemetryChannel.postMessage({
            instanceId: INSTANCE_ID,
            origin: ORIGIN,
            level: level,
            message: msg,
            args: safeArgs,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn('Failed to broadcast telemetry log', e);
    }
};

export const Logger = {
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    info(msg, ...args) {
        console.log(`[ZohoIDE] ${ORIGIN} ${msg}`, ...args);
        broadcastTelemetry('INFO', msg, args);
        this.emit('info', msg);
    },

    warn(msg, ...args) {
        console.warn(`[ZohoIDE] ${ORIGIN} ${msg}`, ...args);
        broadcastTelemetry('WARN', msg, args);
        this.emit('warning', msg);
    },

    error(msg, ...args) {
        console.error(`[ZohoIDE] ${ORIGIN} ${msg}`, ...args);
        broadcastTelemetry('ERROR', msg, args);
        this.emit('error', msg);
    },

    debug(msg, ...args) {
        console.debug(`[ZohoIDE] ${ORIGIN} ${msg}`, ...args);
        broadcastTelemetry('DEBUG', msg, args);
        this.emit('system', msg);
    },

    emit(type, msg) {
        this.listeners.forEach(fn => fn(type, msg));
    }
};
