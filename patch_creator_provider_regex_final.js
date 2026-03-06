const fs = require('fs');

let providerCode = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

// The lineUntilPos match for `var = |` was too eager:
// `([a-zA-Z_]\w*)\s*=\s*([a-zA-Z0-9_]*)$`
// This means typing `var = |` will match and immediately return all forms, blocking other autocompletes if they were typed.
// But actually `registry.js` merges all suggestions. So if it returns forms, they will show alongside variables.
// In the user's screenshot, it did NOT show `Service_Order`. That means it returned `[]`.
// Why would it return `[]`?
// Maybe `isCreatorContext` was false because `creator_schema_draken_portal` wasn't in `interfaceMappings` as expected?
// Or because `currentSchema.forms` was empty?
// Wait, when you create an interface mapping in the UI, `window.interfaceMappings[key]` is created.
// In the screenshot, `creator_schema_draken_portal` is visible in the UI.
// So `window.interfaceMappings` definitely has it.
// The issue must have been that `currentSchema` parsing was wrong or missing the nested `forms` setup.
// I already fixed the parsing in `patch_creator_provider_log.js`.

// Let's make sure the fix is saved properly.
console.log("Looks good");
