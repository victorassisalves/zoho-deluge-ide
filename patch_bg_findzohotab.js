const fs = require('fs');
let code = fs.readFileSync('background.js', 'utf8');

// If `request.payload.targetContextHash` or `request.targetContextHash` is provided, `findZohoTab` PINGs tabs and matches `response.context.contextHash`.
// But wait! Does the IDE tab pass `targetContextHash` when sending `editor:execute`?

// Let's check `app/services/zoho-runner.js`.
console.log("Checking zoho-runner.js");
