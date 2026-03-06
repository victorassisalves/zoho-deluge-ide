const fs = require('fs');
const content = fs.readFileSync('app/core/editor-controller.js', 'utf8');

try {
  new require('vm').Script(content);
  console.log('Syntax OK');
} catch (e) {
  console.error(e);
}
