import re

engine_file = "app/modules/products/creator/engine.js"
with open(engine_file, "r") as f:
    content = f.read()

# Update the regex to support spaces
# Example: myRecord = Service_Order[ID == 1];
# Example: myRecord=Service_Order[ID==1];
# Also account for spaces before and after the equals, and spaces before the opening bracket.

# We want match[1] = myRecord, match[2] = Service_Order
# We can match `([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\[`
fixed_engine = content.replace("const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[.*?\\]/g;", "const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[.*?\\]/g;")
# Wait, let's make it simpler and catch anything with or without the content of the brackets.
fixed_engine = fixed_engine.replace(
    "const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[.*?\\]/g;",
    "const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[.*?\\]/g;"
)

# Actually, the original regex /([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\[.*?\]/g is decent,
# but let's make sure it handles any spacing and the closing bracket could be optional while typing:
# e.g., `var = Service [`
# We want to match: `([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\[`
# Then we don't care what's inside or if the bracket is closed! This way autocomplete works *while* they type the condition!

new_regex_code = """
// Match assignments mapping a variable to a Form.
// The user might be typing: "myRecord = Service_Order [" or "myRecord = Service_Order [ID == 1]"
const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[/g;
"""

fixed_engine = re.sub(r"const assignmentRegex = .*?;", new_regex_code.strip(), content)

with open(engine_file, "w") as f:
    f.write(fixed_engine)

print("Patched regex in engine")

provider_file = "app/modules/products/creator/provider.js"
with open(provider_file, "r") as f:
    content = f.read()

# Update regex in provider to handle the trigger characters and spaces better.
# For insert/delete/fetch:
new_trigger_regex = """
        // 2. Handle Insert/Delete/Fetch Form Suggestions
        // Examples: "insert into ", "delete from ", "= "
        if (/(?:insert\\s+into|delete\\s+from|=)\\s+([a-zA-Z0-9_]*)$/i.test(textUntilPosition) || /(?:insert\\s+into|delete\\s+from|=)\\s+$/.test(textUntilPosition)) {
"""
# Actually, the textUntilPosition matching is already handling this: /(?:insert\s+into|delete\s+from|=)\s+([a-zA-Z0-9_]*)$/i

# We must ensure that form lookup is case-insensitive or exact, Creator JSON usually has exactly what the user should type, but users may mistype.

content = content.replace("if (formName && currentSchema.forms[formName]) {", """
            let formDef = null;
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
            if (formDef) {
""")

with open(provider_file, "w") as f:
    f.write(content)

print("Patched provider")
