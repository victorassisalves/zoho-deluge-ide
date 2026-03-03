const fs = require('fs');
const content = fs.readFileSync('background.js', 'utf8');
console.log(content.includes('targetContextHash'));
