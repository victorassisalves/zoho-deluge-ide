import logger from '../utils/logger.js';
import bus from './bus.js';
import { EVENTS } from './events.js';
import { config } from './config.js';

// Export as lowercase (standard) AND Uppercase (legacy/safety)
export { logger, logger as Logger };
export { bus, bus as eventBus };
export { EVENTS };
export { config };
