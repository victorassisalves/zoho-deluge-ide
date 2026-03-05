import re

file_path = "app/core/editor-controller.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I want to add `flex-grow: 1; min-width: 10px;` so it doesn't push type to a new line
new_content = content.replace("<div style=\"flex-grow:1\"></div>", "<div style=\"flex-grow: 1; min-width: 10px;\"></div>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patched flex layout to add min-width")
