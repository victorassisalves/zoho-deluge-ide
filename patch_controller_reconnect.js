const fs = require('fs');
let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// The `linkedTabs` map in `background.js` is volatile (memory).
// If the user reloads the IDE extension background script, it clears!
// However, `app/core/editor-controller.js` loads the `file` which has `chromeTabId` in Dexie!
// When the IDE selects a file and loads it into the editor, if it has a `chromeTabId`, it should send `LINK_FILE_TO_TAB` to `background.js`!
// Currently it does NOT do that automatically!

const reloadLogic = `
        const tabs = await db.workspace_tabs.where('workspaceId').equals(workspaceId).sortBy('order');
        if (tabs.length > 0) {
`;

// wait, how does `editor-controller.js` load a file?
// `function loadFile(fileId)`
console.log("Checking loadFile");
