import re

with open('ide.js', 'r') as f:
    content = f.read()

# Remove the whole window.addEventListener("keydown", ...) block
search_pattern = r'// Global Fallback for Shortcuts \(Incognito support\)\s+window\.addEventListener\("keydown", \(e\) => \{.*?\}, true\);'
content = re.sub(search_pattern, '', content, flags=re.DOTALL)

with open('ide.js', 'w') as f:
    f.write(content)
