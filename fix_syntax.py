import re

with open('ide.js', 'r') as f:
    content = f.read()

# The problematic area in checkConnection
# We need to find the sendMessage callback and fix the extra brace.

pattern = r'(showStatus\("Disconnected from Zoho", "info"\);\s+nextProjectUrl = "global";\s+)\}\s+(\s+if \(nextProjectUrl !== zideProjectUrl\))'
replacement = r'\1\2'

new_content = re.sub(pattern, replacement, content)

if new_content == content:
    print("Pattern not found, trying alternative")
    # Maybe the indentation is different
    pattern = r'showStatus\("Disconnected from Zoho", "info"\);\s+nextProjectUrl = "global";\s+\}\s+if \(nextProjectUrl !== zideProjectUrl\)'
    # Find where it is and fix it
    content = content.replace('showStatus("Disconnected from Zoho", "info");\n                nextProjectUrl = "global";\n            }\n\n                if (nextProjectUrl !== zideProjectUrl)',
                              'showStatus("Disconnected from Zoho", "info");\n                nextProjectUrl = "global";\n\n                if (nextProjectUrl !== zideProjectUrl)')
    new_content = content

with open('ide.js', 'w') as f:
    f.write(new_content)
