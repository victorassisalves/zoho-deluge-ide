import re

with open('ide.js', 'r') as f:
    content = f.read()

with open('snippet_logic.js', 'r') as f:
    logic = f.read()

# Insert at the end of setupEventHandlers function
pattern = r'(function setupEventHandlers\(\) \{.*?)\n\}'
content = re.sub(pattern, r'\1\n' + logic + '\n}', content, flags=re.DOTALL)

with open('ide.js', 'w') as f:
    f.write(content)
