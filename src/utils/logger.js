/**
 * Standardized Logger for Zoho Deluge IDE
 */
const PREFIX = '[ZohoIDE]';

export const logger = {
    info: (msg, ...args) => console.log(PREFIX + ' ' + msg, ...args),
    warn: (msg, ...args) => console.warn(PREFIX + ' ' + msg, ...args),
    error: (msg, ...args) => console.error(PREFIX + ' ' + msg, ...args),
    debug: (msg, ...args) => {
        if (window.ZIDE_DEBUG) {
            console.debug(PREFIX + ' ' + msg, ...args);
        }
    }
};

export default logger;
