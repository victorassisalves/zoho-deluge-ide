const fs = require('fs');
let contentJS = fs.readFileSync('extension/host/content.js', 'utf8');

// The `handleMessage` logic relies on `request.code`
// But it comes inside `request.payload.code` from `bus.js`
contentJS = contentJS.replace(/request\.code/g, '(request.code || (request.payload && request.payload.code))');

fs.writeFileSync('extension/host/content.js', contentJS);
console.log('Content payload extraction patched');
