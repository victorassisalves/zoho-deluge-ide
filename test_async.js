const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('async')) {
        console.log((i + 1) + ':', lines[i]);
    }
}
