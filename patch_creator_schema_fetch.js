const fs = require('fs');

let providerCode = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

// Also modify the `var = form[` to be captured properly.
const varMatchLogic = `
        // 2. Record Fetch Form Autocomplete: \`var = |\` or \`var = Form[\`
        const assignMatch = lineUntilPos.match(/([a-zA-Z_]\\w*)\\s*=\\s*([a-zA-Z0-9_]*)$/);
        if (assignMatch && !lineUntilPos.includes('.')) {
             const suggestions = [];
             for (const [formKey, formData] of Object.entries(currentSchema.forms)) {
                suggestions.push({
                    label: formKey,
                    kind: 7, // Class/Form
                    insertText: formKey,
                    detail: \`Form: \${formData.displayName}\`,
                    sortText: \`0_\${formKey}\`
                });
            }
            return suggestions;
        }

        // 2b. If they type \`Form[\` and it triggers, we probably don't need autocomplete inside \`[]\` unless it's fields.
        // Wait, what if they type \`Service[|\` ? We should suggest fields for \`Service\`.
        const fetchMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\\[([a-zA-Z0-9_]*)$/);
        if (fetchMatch) {
             const formName = fetchMatch[1];
             if (currentSchema.forms[formName]) {
                 const formData = currentSchema.forms[formName];
                 const suggestions = [];
                 if (formData && formData.fields) {
                     for (const [fieldKey, fieldData] of Object.entries(formData.fields)) {
                        let sortPrefix = "1_";
                        if (fieldData.isMandatory) sortPrefix = "0_";
                        else if (fieldData.isSystemField) sortPrefix = "9_";

                        suggestions.push({
                            label: fieldKey,
                            kind: 10,
                            insertText: fieldKey,
                            detail: \`\${fieldData.type}\${fieldData.isMandatory ? ' (Mandatory)' : ''}\`,
                            documentation: fieldData.isSystemField ? 'System Field' : 'Custom Field',
                            sortText: \`\${sortPrefix}\${fieldKey}\`
                        });
                    }
                    return suggestions;
                 }
             }
        }
`;

providerCode = providerCode.replace(/\/\/ 2\. Record Fetch Form Autocomplete: \`var = \|\`[\s\S]*?(?=\/\/ 3\. Dot Notation \(Record Fields\): \`myRecord\.\|`)/, varMatchLogic);
fs.writeFileSync('app/modules/products/creator/provider.js', providerCode);
console.log('Fixed assignMatch regex and added bracket fetch field autocomplete');
