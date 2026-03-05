import re

file_path = "app/core/editor-controller.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace action button HTML text with material icons
new_content = content.replace("copyPathBtn.innerText = 'Path';", "copyPathBtn.innerHTML = '<span class=\"material-icons\" style=\"font-size: 14px;\">content_copy</span>';")
new_content = new_content.replace("copyJsonBtn.innerText = 'JSON';", "copyJsonBtn.innerHTML = '<span class=\"material-icons\" style=\"font-size: 14px;\">data_object</span>';")
new_content = new_content.replace("copyMapBtn.innerText = 'Map';", "copyMapBtn.innerHTML = '<span class=\"material-icons\" style=\"font-size: 14px;\">account_tree</span>';")

# Replace existing tree-type to not have "margin-left" inline so it inherits the flex logic
# The original code has `<span class="tree-type">${isArray ? 'List' : (isObject ? 'Map' : typeof val)}</span>`
# We'll just leave it as is, our CSS should take over if we override .tree-type

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patched editor-controller.js successfully")
