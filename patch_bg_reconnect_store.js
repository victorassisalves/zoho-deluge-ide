const fs = require('fs');

let code = fs.readFileSync('background.js', 'utf8');

const storeLogic = `
        const linkToTab = (targetTabId) => {
            linkedTabs.set(targetTabId, fileId); // Cache the connection globally
            chrome.tabs.sendMessage(targetTabId, { action: 'SET_CONTEXT_HASH', contextHash: fileId }, (res) => {
`;

code = code.replace(/const linkToTab = \(targetTabId\) => \{\s*chrome\.tabs\.sendMessage\(targetTabId, \{ action: 'SET_CONTEXT_HASH', contextHash: fileId \}, \(res\) => \{/, storeLogic);

fs.writeFileSync('background.js', code);
console.log("Cached targetTabId inside LINK_FILE_TO_TAB");
