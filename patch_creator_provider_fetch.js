const fs = require('fs');
let providerCode = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

const fetchLogic = `
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

if (!providerCode.includes("const fetchMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\\[([a-zA-Z0-9_]*)$/);")) {
    providerCode = providerCode.replace(/\/\/ 3\. Dot Notation \(Record Fields\): \`myRecord\.\|\`/, fetchLogic + "\n\n        // 3. Dot Notation (Record Fields): `myRecord.|`");
    fs.writeFileSync('app/modules/products/creator/provider.js', providerCode);
    console.log("Added fetchMatch logic");
} else {
    console.log("Already added fetchMatch");
}
