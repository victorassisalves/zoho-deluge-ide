// If `currentContext` is null or `currentContext.orgId` is missing, the interception fails.
// When testing standalone (without being fully connected), `currentContext` might not be fully populated.
// We should remove the strict `currentContext.orgId` requirement for the interception to just SAVE the schema.
// If it intercepts a payload, it should save it, regardless of the active context!

const fs = require('fs');
let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

const replacement = `
        if (payload.type === 'creator') {
            const apps = payload.payload.apps;
            if (apps) {
                const appKey = Object.keys(apps)[0];
                if (appKey) {
                    const settingsKey = \`schema_creator_\${appKey}\`;
                    await setSetting(settingsKey, apps[appKey]);
                    Logger.success('controller', \`Saved Creator Schema for app: \${appKey}\`);

                    // Automatically add to Interface Manager for visibility
`;

code = code.replace(/if \(payload\.type === 'creator' && currentContext && currentContext\.orgId\) \{\s*const apps = payload\.payload\.apps;\s*if \(apps\) \{\s*const appKey = Object\.keys\(apps\)\[0\];\s*if \(appKey\) \{\s*const settingsKey = \`schema_creator_\$\{appKey\}\`;\s*await setSetting\(settingsKey, apps\[appKey\]\);\s*Logger\.success\('controller', \`Saved Creator Schema for app: \$\{appKey\}\`\);\s*\/\/ Automatically add to Interface Manager for visibility/, replacement);

fs.writeFileSync('app/core/editor-controller.js', code);
console.log('Removed strict currentContext check on intercept');
