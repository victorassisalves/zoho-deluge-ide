const fs = require('fs');

let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Verify CSP settings.
// Now that we fixed the blob wrapper, we just need to make sure the relative worker is allowed.
// MV3 allows extension relative workers automatically since they are same-origin.
// We can actually just keep the CSP we added or tweak it.
console.log(manifest.content_security_policy);
