import { config } from './config.js';

export class Logger {
    constructor() {
        this.prefix = '[DelugeIDE]';
    }

    _log(level, message, ...args) {
        // Internal log method for extensibility (e.g., Diagnostics Panel)
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const formattedMessage = `${this.prefix} [${level}] ${message}`;

        switch (level) {
            case 'INFO':
                console.info(formattedMessage, ...args);
                break;
            case 'WARN':
                console.warn(formattedMessage, ...args);
                break;
            case 'ERROR':
                console.error(formattedMessage, ...args);
                break;
            case 'DEBUG':
                if (config.debug) {
                    console.debug(formattedMessage, ...args);
                }
                break;
        }
    }

    info(message, ...args) {
        this._log('INFO', message, ...args);
    }

    warn(message, ...args) {
        this._log('WARN', message, ...args);
    }

    error(message, ...args) {
        this._log('ERROR', message, ...args);
    }

    debug(message, ...args) {
        this._log('DEBUG', message, ...args);
    }
}

const logger = new Logger();
export default logger;
