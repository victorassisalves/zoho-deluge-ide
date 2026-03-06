const fs = require('fs');
let bgCode = fs.readFileSync('background.js', 'utf8');

const fixCode = `
    let isSidePanel = sender.tab && isZohoUrl(sender.tab.url);
    // If the IDE explicitly passes targetTabId (from chromeTabId in db), use it!
    let targetTabId = isSidePanel ? sender.tab.id : (request.targetTabId || (request.payload && request.payload.targetTabId) || null);
`;

bgCode = bgCode.replace(/let isSidePanel = sender\.tab && isZohoUrl\(sender\.tab\.url\);\s*let targetTabId = isSidePanel \? sender\.tab\.id : null;/, fixCode);

fs.writeFileSync('background.js', bgCode);
console.log('Fixed background.js targetTabId resolution');
