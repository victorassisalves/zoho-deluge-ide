const fs = require('fs');
let code = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

// The issue might also be the regex for inferVariableForms.
// User screenshot:
// var = Map();
// variable = Ser|
//
// In this case, `variable = Ser` is partially typed. We need to autocomplete "Service_Order".
// Wait, the regex for assignMatch was:
// /^[ \t]*[a-zA-Z_]\w*\s*=\s*([a-zA-Z0-9_]*)$/
// Wait, user is just typing `variable = Ser`.
// Let's check my match logic in `provide` for form autocomplete.
//
// const assignMatch = lineUntilPos.match(/^[ \t]*[a-zA-Z_]\w*\s*=\s*([a-zA-Z0-9_]*)$/);
// if (assignMatch && !lineUntilPos.includes('.')) {
// ...

// Actually the regex logic I added should have caught it.
// Let's make it a bit looser, so if we type `variable = Ser` it will suggest forms.
// Oh wait! Interface mapping creates Map variables.
// User typed `variable = Ser`, and it shows `/crm/searchRecords`, `/creator/searchRecords`, `creator_schema_draken_portal`.
// This means Monaco is triggering default keyword/variable suggestions, but NOT my Creator Form suggestions.
// Let's check if CreatorProvider is even returning anything for `assignMatch`.
// The regex `^[ \t]*[a-zA-Z_]\w*\s*=\s*([a-zA-Z0-9_]*)$` matches `    variable = Ser`.
// However, maybe `isCreatorContext` check is failing because the user mapped it as a variable instead of an Interface Map?
// Wait, the Interface Manager injects it into `window.interfaceMappings`.
// Yes, `Object.keys(window.interfaceMappings)` will have `creator_schema_draken_portal`.
// Wait! If the user added it via Interface Manager, it might actually be in `db.files.variables`.
// The Interface Manager UI modifies `window.interfaceMappings` and the file's variables.
// In `app/modules/analysis.js`, `extractVariables` also populates `window.interfaceMappings` if it sees a literal map... wait no, Interface Manager is separate.
// Let me verify the parsing logic for mappedSchema.

// "Convert the simplified interface map format back to our expected forms structure"
// mappedSchema in Interface Manager might be `{ Service: { Status: "[STRING]" } }`.
// Wait, Interface Manager values are flat maps if imported from JSON?
// If the user pasted the JSON, Interface Manager maps it like: `Service.Status: "[STRING]"`, or is it nested?
// Let's look at the screenshot.
// `creator_schema_draken_portal` has `Service: {`, and inside it `Status: "[STRING]"`. It's definitely nested.
// But wait! Is the `creator_schema_` prefix working?
// In the screenshot, the key is `creator_schema_draken_portal`.
// My code checks: `schemaKeys[0]` which is `creator_schema_draken_portal`.
// And then `const mappedSchema = window.interfaceMappings[schemaKey];`.
// Is `interfaceMappings` loaded synchronously? Yes.

// Wait, the autocomplete items in Monaco require `kind: 7` (Class) to show up as a different icon.
// The screenshot shows `creator_schema_draken_portal` as a snippet or variable.
// I should also ensure that the Provider actually returns the suggestions.
// What if `lineUntilPos` has trailing spaces? `variable = Ser` doesn't.
// Let's remove the `^` from `assignMatch` just in case.
const regexReplacement = `const assignMatch = lineUntilPos.match(/([a-zA-Z_]\\w*)\\s*=\\s*([a-zA-Z0-9_]*)$/);`;
code = code.replace(/const assignMatch = lineUntilPos.match\(\/\^\[ \\t\]\*\[a-zA-Z_\]\\w\*\\s\*=\\s\*\(\[a-zA-Z0-9_\]\*\)\$\/\);/, regexReplacement);

fs.writeFileSync('app/modules/products/creator/provider.js', code);
console.log('Fixed assignMatch regex');
