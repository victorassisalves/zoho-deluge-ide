const fs = require('fs');
let code = fs.readFileSync('app/services/zoho-runner.js', 'utf8');

const pushPatch = `
    pushToZoho(code, triggerSave = false, triggerExecute = false, contextHash = null, targetTabId = null) {
        if (!code) return;

        console.log('[ZohoRunner] Syncing with Zoho...', { triggerSave, triggerExecute });

        const payload = { code: code };
        if (contextHash) payload.targetContextHash = contextHash;
        if (targetTabId) payload.targetTabId = targetTabId;
        payload.autoFocus = true; // Auto focus on push/save
`;

code = code.replace(/pushToZoho\(code, triggerSave = false, triggerExecute = false, contextHash = null\) \{\s*if \(!code\) return;\s*console\.log\('\[ZohoRunner\] Syncing with Zoho\.\.\.', \{ triggerSave, triggerExecute \}\);\s*const payload = \{ code: code \};\s*if \(contextHash\) payload\.targetContextHash = contextHash;\s*payload\.autoFocus = true; \/\/ Auto focus on push\/save/, pushPatch);

const pullPatch = `
    pullFromZoho(contextHash = null, targetTabId = null) {
        console.log('[ZohoRunner] Pulling code from Zoho...');
        // We use the standard protocol message
        const payload = {};
        if (contextHash) payload.targetContextHash = contextHash;
        if (targetTabId) payload.targetTabId = targetTabId;
        payload.autoFocus = true; // Auto focus on pull
`;

code = code.replace(/pullFromZoho\(contextHash = null\) \{\s*console\.log\('\[ZohoRunner\] Pulling code from Zoho\.\.\.'\);\s*\/\/ We use the standard protocol message\s*const payload = \{\};\s*if \(contextHash\) payload\.targetContextHash = contextHash;\s*payload\.autoFocus = true; \/\/ Auto focus on pull/, pullPatch);

fs.writeFileSync('app/services/zoho-runner.js', code);
console.log('Patched zoho-runner.js to pass targetTabId via payload');
