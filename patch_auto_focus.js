const fs = require('fs');

let bg = fs.readFileSync('background.js', 'utf8');

// Ensure that we focus the tab if request.autoFocus is set in background.js
// We already added:
// if (request.autoFocus) {
//     chrome.tabs.update(tab.id, { active: true });
//     chrome.windows.update(tab.windowId, { focused: true });
// }
// in the previous step. Let's verify it is there.

console.log(bg.includes('request.autoFocus'));
