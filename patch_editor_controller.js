const fs = require('fs');
const path = 'app/core/editor-controller.js';
let content = fs.readFileSync(path, 'utf8');

// Also update checkConnection interval to 3000ms from 5000ms just to be more responsive? Or leave it.
// Let's just fix the explorer jumping
// We also need to fix context hash on context switch
console.log("Ready for next step");
