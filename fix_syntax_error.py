import re

with open('ide.js', 'r') as f:
    content = f.read()

# Specifically look for the }); pattern that's causing issues
content = re.sub(r'\} catch\(e\) \{\}\s+\}\);\s+document\.getElementById\(\'font-size-input\'\)\.value = result\.font_size;\s+\}', '} catch(e) {} }', content)

with open('ide.js', 'w') as f:
    f.write(content)
