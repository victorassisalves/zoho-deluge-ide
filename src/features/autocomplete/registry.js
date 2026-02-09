import diagnostics from '../../services/diagnostics.js';

class AutocompleteRegistry {
    constructor() {
        this.providers = [];
    }

    register(provider) {
        if (!provider || typeof provider.provide !== 'function') return;
        this.providers.push(provider);
        diagnostics.report('AutocompleteRegistry', 'registered provider: ' + (provider.name || 'anon'));
    }

    async getSuggestions(model, position, context) {
        const results = await Promise.all(
            this.providers.map(async (provider) => {
                try {
                    const suggestions = await provider.provide(model, position, context);
                    return Array.isArray(suggestions) ? suggestions : [];
                } catch (err) {
                    console.error('Provider error:', provider.name, err);
                    return [];
                }
            })
        );
        return results.flat();
    }
}

const registry = new AutocompleteRegistry();
export default registry;
