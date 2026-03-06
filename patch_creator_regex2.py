import re

engine_file = "app/modules/products/creator/engine.js"
with open(engine_file, "r") as f:
    content = f.read()

# Replace using string replace to avoid re issues
content = content.replace(
    "const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[.*?\\]/g;",
    "const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=\\s*([a-zA-Z0-9_]+)\\s*\\[/g;"
)

with open(engine_file, "w") as f:
    f.write(content)

print("Patched regex in engine")
