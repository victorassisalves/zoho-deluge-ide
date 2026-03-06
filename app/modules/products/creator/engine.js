/**
 * app/modules/products/creator/engine.js
 *
 * The Creator Sandbox Engine.
 * Responsible for parsing the AST/Syntax to track variable assignments mapped to Form names.
 */

// Regex to capture: <Variable> = <Form_Name>[ <Criteria> ];
// Example: myRecord = Service_Order[ID == 1];
// Match group 1: variable name
// Match group 2: form name
const assignmentRegex = /([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\[/g;

/**
 * Scans the provided text and returns a map of variable names to their corresponding form names.
 * We use this to provide autocomplete for variable dot-notation (e.g., myRecord.<field>).
 * @param {string} text - The full text of the editor model.
 * @returns {Object} Map of variableName -> formName
 */
export function scanAssignments(text) {
    const mappings = {};
    if (!text) return mappings;

    let match;
    // Reset lastIndex just in case
    assignmentRegex.lastIndex = 0;

    while ((match = assignmentRegex.exec(text)) !== null) {
        const varName = match[1];
        const formName = match[2];
        mappings[varName] = formName;
    }

    return mappings;
}

// Debounced wrapper to prevent blocking the main thread during typing
let debounceTimeout = null;
let cachedMappings = {};

export function updateMappingsDebounced(text, callback, delay = 500) {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
        cachedMappings = scanAssignments(text);
        if (callback) callback(cachedMappings);
    }, delay);
}

export function getCachedMappings() {
    return cachedMappings;
}
