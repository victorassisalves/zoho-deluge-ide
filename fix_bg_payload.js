const fs = require('fs');
let bg = fs.readFileSync('background.js', 'utf8');

// The request object coming from bus.js has: { type, instanceId, payload }
// background.js maps type -> action, so it is { action, instanceId, payload }
// We need to use request.payload.targetContextHash instead of request.targetContextHash
// And request.payload.autoFocus instead of request.autoFocus

bg = bg.replace(/request\.targetContextHash/g, '(request.payload && request.payload.targetContextHash) || request.targetContextHash');
bg = bg.replace(/request\.autoFocus/g, '(request.payload && request.payload.autoFocus) || request.autoFocus');

fs.writeFileSync('background.js', bg);
console.log('Background payload extraction patched');
