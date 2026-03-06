import re

provider_file = "app/modules/products/creator/provider.js"
with open(provider_file, "r") as f:
    content = f.read()

# Fix import path for MSG, actually it should be import { MSG } from '../../../../shared/protocol.js' Wait, no, shared is at the root
# Let's adjust paths.
# app/modules/products/creator/provider.js ->
# Bus: ../../../core/bus.js
# MSG: ../../../../shared/protocol.js

# We can replace the Bus and MSG imports and hardcode the SCHEMA_CAPTURED event in provider to avoid import path issues.

fixed_content = """
import { Bus } from '../../../core/bus.js';

let currentSchema = null;
let cachedMappings = {};

// 1. Listen for SCHEMA_CAPTURED to update the reactive cache
Bus.listen('SCHEMA_CAPTURED', (schemaPayload) => {
    console.log('[CreatorEngine] Provider reactive cache updated via SCHEMA_CAPTURED');
    if (schemaPayload && schemaPayload.schema) {
        currentSchema = schemaPayload.schema;
    } else {
        currentSchema = schemaPayload;
    }
});

import { scanAssignments } from './engine.js';

// Monaco CompletionItemProvider
export const creatorProvider = {
    triggerCharacters: ['.', ' ', '[', '='],

    provideCompletionItems: function(model, position, context, token) {
        if (!currentSchema || !currentSchema.forms) return { suggestions: [] };

        const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        const suggestions = [];

        // 1. Handle Dot-Notation Field Access (e.g. myRecord.FieldName)
        const dotMatch = textUntilPosition.match(/([a-zA-Z0-9_]+)\.$/);
        if (dotMatch) {
            const varName = dotMatch[1];
            // Only scan text when needed
            const fullText = model.getValue();
            const mappings = scanAssignments(fullText);

            const formName = mappings[varName];
            if (formName && currentSchema.forms[formName]) {
                const formDef = currentSchema.forms[formName];

                Object.values(formDef.fields || {}).forEach(field => {
                    let sortPrefix = "1_"; // Default Custom
                    if (field.isMandatory) {
                        sortPrefix = "0_"; // Mandatory Pin Top
                    } else if (field.isSystemField) {
                        sortPrefix = "9_"; // System Pin Bottom
                    }

                    suggestions.push({
                        label: field.linkName || field.displayName,
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: field.linkName,
                        detail: `Creator Field (${field.type})`,
                        documentation: `Form: ${formDef.displayName}\\nType: ${field.type}\\nMandatory: ${field.isMandatory ? 'Yes' : 'No'}\\nSystem Field: ${field.isSystemField ? 'Yes' : 'No'}`,
                        sortText: sortPrefix + field.linkName
                    });
                });
            }
            return { suggestions };
        }

        // 2. Handle Insert/Delete/Fetch Form Suggestions
        // Examples: "insert into ", "delete from ", "= "
        // Add regex logic
        if (/(?:insert\s+into|delete\s+from|=)\s+([a-zA-Z0-9_]*)$/i.test(textUntilPosition) || /(?:insert\s+into|delete\s+from|=)\s+$/.test(textUntilPosition)) {
            Object.keys(currentSchema.forms || {}).forEach(formKey => {
                const formDef = currentSchema.forms[formKey];
                suggestions.push({
                    label: formKey, // Typically the internal name is used
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: formKey,
                    detail: 'Creator Form',
                    documentation: `Display Name: ${formDef.displayName}`,
                    sortText: "1_" + formKey
                });
            });
            return { suggestions };
        }

        return { suggestions: [] };
    }
};
"""

with open(provider_file, "w") as f:
    f.write(fixed_content)
