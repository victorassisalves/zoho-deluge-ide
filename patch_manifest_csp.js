const fs = require('fs');
let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Add CSP to allow Web Workers to execute
manifest.content_security_policy = {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('Added CSP to manifest.json');
