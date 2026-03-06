provider_file = "app/modules/products/creator/provider.js"
with open(provider_file, "r") as f:
    content = f.read()

# Replace the specific block
old_block = """            if (formName && currentSchema.forms[formName]) {
                const formDef = currentSchema.forms[formName];"""
new_block = """            let formDef = null;
            if (formName) {
                // Exact match first
                if (currentSchema.forms[formName]) {
                    formDef = currentSchema.forms[formName];
                } else {
                    // Case-insensitive match
                    const key = Object.keys(currentSchema.forms).find(k => k.toLowerCase() === formName.toLowerCase());
                    if (key) formDef = currentSchema.forms[key];
                }
            }
            if (formDef) {"""

content = content.replace(old_block, new_block)

# Fix the regex in provider to catch space around the assignment properly:
# Examples: "insert into ", "delete from ", "= "
old_regex = """if (/(?:insert\\s+into|delete\\s+from|=)\\s+([a-zA-Z0-9_]*)$/i.test(textUntilPosition) || /(?:insert\\s+into|delete\\s+from|=)\\s+$/.test(textUntilPosition)) {"""
new_regex = """if (/(?:insert\\s+into|delete\\s+from|=)\\s+([a-zA-Z0-9_]*)$/i.test(textUntilPosition) || /(?:insert\\s+into|delete\\s+from|=)\\s*$/.test(textUntilPosition)) {"""
content = content.replace(old_regex, new_regex)

with open(provider_file, "w") as f:
    f.write(content)

print("Patched regex in provider")
