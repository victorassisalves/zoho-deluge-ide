/**
 * Autocomplete Provider Registry
 */
import logger from '../../utils/logger.js';

class AutocompleteRegistry {
    constructor() {
        this.providers = [];
    }

    register(provider) {
        if (!provider || typeof provider.provide !== 'function') {
            logger.error('Invalid provider');
            return;
        }
        this.providers.push(provider);
        logger.info('Registered autocomplete provider: ' + (provider.name || 'Anonymous'));
    }

    async getSuggestions(model, position, context) {
        const results = await Promise.all(
            this.providers.map(async (provider) => {
                try {
                    const suggestions = await provider.provide(model, position, context);
                    return Array.isArray(suggestions) ? suggestions : [];
                } catch (err) {
                    logger.error('Error in provider ' + provider.name, err);
                    return [];
                }
            })
        );

        return results.flat();
    }
}

const registry = new AutocompleteRegistry();
export default registry;
