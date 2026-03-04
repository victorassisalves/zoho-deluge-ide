const fs = require('fs');

let content = fs.readFileSync('app/services/zoho-runner.js', 'utf8');

// Modify pushToZoho and pullFromZoho to include context hash and auto focus flag
content = content.replace(
`    pushToZoho(code, triggerSave = false, triggerExecute = false) {`,
`    pushToZoho(code, triggerSave = false, triggerExecute = false, contextHash = null) {`
);

content = content.replace(
`        if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send(MSG.CODE_SAVE, { code: code });
        }`,
`        const payload = { code: code };
        if (contextHash) payload.targetContextHash = contextHash;
        payload.autoFocus = true; // Auto focus on push/save

        if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send(MSG.CODE_SAVE, payload);
        }`
);

content = content.replace(
`                console.debug('[ZohoRunner] Action: EXECUTE');
                Bus.send(MSG.CODE_EXECUTE, { code: code });`,
`                console.debug('[ZohoRunner] Action: EXECUTE');
                Bus.send(MSG.CODE_EXECUTE, payload);`
);

content = content.replace(
`            Bus.send('SET_ZOHO_CODE', { code: code });`,
`            Bus.send('SET_ZOHO_CODE', payload);`
);


content = content.replace(
`    pullFromZoho() {`,
`    pullFromZoho(contextHash = null) {`
);

content = content.replace(
`        Bus.send(MSG.CODE_PULL);`,
`        const payload = {};
        if (contextHash) payload.targetContextHash = contextHash;
        payload.autoFocus = true; // Auto focus on pull
        Bus.send(MSG.CODE_PULL, payload);`
);

fs.writeFileSync('app/services/zoho-runner.js', content);
console.log('Runner patched');
