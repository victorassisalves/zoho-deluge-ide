/**
 * src/core/index.js
 * The Core Layer Public Interface
 */
import logger from '../utils/logger.js';
import bus from './bus.js'; // Imports default
import { EVENTS } from './events.js';

// Re-export for the rest of the app
export { logger, logger as Logger };
export { bus, bus as eventBus };
export { EVENTS };

// Placeholder exports if files are missing, prevents crash
export const config = { debug: true };
export const connection = { status: 'mock' };
