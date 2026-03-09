const fs = require('fs');

try {
    const acorn = require('acorn');
    const code = fs.readFileSync('app/core/editor-controller.js', 'utf8');
    acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    console.log("No syntax errors found by acorn.");
} catch(e) {
    console.log("Acorn error: ", e.message);
}
