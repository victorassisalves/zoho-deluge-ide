import re

manifest_file = "manifest.json"
with open(manifest_file, "r") as f:
    content = f.read()

# Check what the CSP is right now
print(re.search(r'"content_security_policy".*', content))
