const fs = require('fs');
let code = fs.readFileSync('background.js', 'utf8');

// In `findZohoTab`, if `targetContextHash` is requested and the tab just reloaded (and PING fails or returns null contextHash),
// `findZohoTab` will fail to find the tab!
// Wait! We now have `linkedTabs` map mapping `tabId` to `contextHash`!
// We can just look up `linkedTabs`!
const findZohoTabMap = `
        if (targetContextHash) {
            // First check our cache for a direct map
            for (const [tId, hash] of linkedTabs.entries()) {
                if (hash === targetContextHash) {
                    const cachedTab = zohoTabs.find(t => t.id === tId);
                    if (cachedTab) {
                        return callback(cachedTab);
                    }
                }
            }

            // Ping tabs to find matching context (fallback)
`;

code = code.replace(/if \(targetContextHash\) \{\s*\/\/ Ping tabs to find matching context/, findZohoTabMap);

fs.writeFileSync('background.js', code);
console.log('Fixed findZohoTab to use linkedTabs cache for immediate multi-tab resolution');
