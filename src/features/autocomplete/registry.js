/**
 * Autocomplete Provider Registry (Hybrid B3 Hub)
 */
import logger from '../../utils/logger.js';

class AutocompleteRegistry {
    constructor() {
        this.providers = [];
    }

    register(provider) {
        if (typeof provider.provide !== 'function') {
            logger.error('Invalid provider: must implement provide() method');
            return;
        }
        this.providers.push(provider);
        logger.info(`Registered autocomplete provider: ${provider.name || 'Anonymous'}`);
    }

    async getSuggestions(model, position, context) {
        const results = await Promise.all(
            this.providers.map(async (provider) => {
                try {
                    const suggestions = await provider.provide(model, position, context);
                    return Array.isArray(suggestions) ? suggestions : [];
                } catch (err) {
                    logger.error(`Error in provider ${provider.name}:`, err);
                    return [];
                }
            })
        );

        // Flatten and return all suggestions
        return results.flat();
    }
}

const registry = new AutocompleteRegistry();
export default registry;
