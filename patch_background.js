const fs = require('fs');

let bg = fs.readFileSync('background.js', 'utf8');

// The matching logic relies on an orgId fallback which might be dangerous
// Let's remove the fallback and make it strict matching
bg = bg.replace(
`                    if (response && response.context && response.context.contextHash === targetContextHash && !foundTab) {
                        foundTab = tab;
                        callback(tab);
                    } else if (response && response.context && targetContextHash.includes(response.context.orgId) && !foundTab) {
                        // Fallback matching by orgId just in case functionName differs slightly
                        foundTab = tab;
                        callback(tab);
                    }`,
`                    if (response && response.context && response.context.contextHash === targetContextHash && !foundTab) {
                        foundTab = tab;
                        callback(tab);
                    }`
);

fs.writeFileSync('background.js', bg);
console.log('Background matching patched');
