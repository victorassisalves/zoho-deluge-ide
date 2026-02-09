# Autocomplete Feature (B1+B3 Hybrid)

## Purpose
Provides context-aware suggestions for Deluge code, including keywords, methods, Zoho tasks, and variables.

## Structure
- `engine.js`: Monaco registration and event handling.
- `registry.js`: Central hub for merging results from different providers.
- `providers/`: Specialized plugins for different types of suggestions.
- `data/`: Static definition files for keywords and methods.

## API
- `initAutocomplete(monaco)`: Initializes the entire autocomplete system.
- `registry.register(provider)`: Add a new provider at runtime.

## Golden Rules
1. **Source Isolation**: Do NOT add native Deluge keywords to `zoho-task-provider.js`. Keep them in `keyword-provider.js`.
2. **Provider Independence**: A provider should not depend on another provider's state.
3. **Performance**: Providers must return results as quickly as possible (use \`async\` but avoid heavy processing).
4. **No Side Effects**: `provide()` should be a pure function that returns suggestions based on the inputs.
