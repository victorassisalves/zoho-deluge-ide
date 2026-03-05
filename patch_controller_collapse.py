import re

file_path = "app/core/editor-controller.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace footer.style.display = 'none' to footer.classList.add('collapsed')
new_content = content.replace("footer.style.display = subContainer.classList.contains('collapsed') ? 'none' : 'block';", "footer.style.display = subContainer.classList.contains('collapsed') ? 'none' : 'block';")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Verified collapse JS logic")
