import re

file_path = "app/core/editor-controller.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's adjust the label layout to push type/actions nicely.
# Current: label.innerHTML = `${iconHtml} ${keyHtml}${valHtml} ${typeHtml}`;
new_content = content.replace("label.innerHTML = `${iconHtml} ${keyHtml}${valHtml} ${typeHtml}`;", "label.innerHTML = `${iconHtml} ${keyHtml}${valHtml} <div style=\"flex-grow:1\"></div>${typeHtml}`;")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patched flex layout")
