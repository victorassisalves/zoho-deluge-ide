import { config } from './config.js';
export class Logger {
    static info(msg, ...args) { if (config.debug) console.log(`[DelugeIDE] ℹ️ ${msg}`, ...args); }
    static warn(msg, ...args) { console.warn(`[DelugeIDE] ⚠️ ${msg}`, ...args); }
    static error(msg, ...args) { console.error(`[DelugeIDE] ❌ ${msg}`, ...args); }
    static debug(msg, ...args) { if (config.debug) console.debug(`[DelugeIDE] 🐞 ${msg}`, ...args); }
}
