import re

manifest_file = "manifest.json"
with open(manifest_file, "r") as f:
    content = f.read()

print("MANIFEST CONTENT:")
print(content)
