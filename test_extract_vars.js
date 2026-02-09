const fs = require('fs');
const content = fs.readFileSync('deluge-lang.js', 'utf8');

// Extract the function body
const match = content.match(/function extractVariables\(code\) \{([\s\S]*?)\n    \}/);
if (!match) {
    console.error("Could not find extractVariables");
    process.exit(1);
}

const body = match[1];
const extractVariables = new Function('code', body + '\nreturn vars;');

const testCode = `
void myFunc(string param1, int param2) {
    var1 = "hello";
    for each item in list1 {
        info item;
    }
}
`;

const vars = extractVariables(testCode);
console.log("Extracted vars:", Array.from(vars));

if (vars.has('param1') && vars.has('param2') && vars.has('var1') && vars.has('item')) {
    console.log("SUCCESS");
} else {
    console.error("FAILURE: Missing some variables");
    process.exit(1);
}
