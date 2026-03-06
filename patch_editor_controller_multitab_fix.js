const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

const pullPatch = `
function pullFromZoho() {
    log('Info', 'Pulling code from Zoho...');
    const tabId = window.currentTargetTab ? window.currentTargetTab.id : null;
    ZohoRunner.pullFromZoho(currentContextHash, tabId);
}
`;

code = code.replace(/function pullFromZoho\(\) \{\s*log\('Info', 'Pulling code from Zoho\.\.\.'\);\s*const tabId = window\.currentTargetTab \? window\.currentTargetTab\.id : null;\s*ZohoRunner\.pullFromZoho\(currentContextHash, tabId\);\s*\}/, pullPatch);

const pushPatch = `
function pushToZoho(triggerSave = false, triggerExecute = false) {
    const now = Date.now();
    if (now - lastActionTime < 1000) return;
    lastActionTime = now;

    // Check for errors
    const markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
    if (errors.length > 0) {
        log('Error', 'Fix syntax errors before pushing to Zoho.');
        showStatus('Push Blocked: Errors', 'error');
        return;
    }

    const code = editor.getValue();
    const tabId = window.currentTargetTab ? window.currentTargetTab.id : null;
    ZohoRunner.pushToZoho(code, triggerSave, triggerExecute, currentContextHash, tabId);
}
`;

// Make sure it's applied correctly
if (!code.includes("window.currentTargetTab.id")) {
    console.log("My previous patch regex failed. Let's force it.");

    code = code.replace(/function pushToZoho\(triggerSave = false, triggerExecute = false\) \{[\s\S]*?ZohoRunner\.pushToZoho\(code, triggerSave, triggerExecute, currentContextHash\);\s*\}/, pushPatch);

    code = code.replace(/function pullFromZoho\(\) \{\s*log\('Info', 'Pulling code from Zoho\.\.\.'\);\s*ZohoRunner\.pullFromZoho\(currentContextHash\);\s*\}/, pullPatch);

    fs.writeFileSync('app/core/editor-controller.js', code);
    console.log("Forced patched editor-controller.js");
} else {
    console.log("Already patched.");
}
