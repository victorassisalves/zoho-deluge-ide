const fs = require('fs');

let code = fs.readFileSync('background.js', 'utf8');
const broadcastCode = `
    // Route SCHEMA_CAPTURED to all extension tabs (IDE)
    if (request.action === 'SCHEMA_CAPTURED') {
        chrome.tabs.query({ url: chrome.runtime.getURL('*') }, (tabs) => {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, request);
            }
        });
        // We also allow it to be processed here or just let it fall through
        return true;
    }
`;

if (code.includes("if (request.action === 'SCHEMA_CAPTURED') {")) {
    console.log("Already patched background.js");
} else {
    code = code.replace("chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n", "chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n" + broadcastCode);
    fs.writeFileSync('background.js', code);
    console.log("Patched background.js");
}
