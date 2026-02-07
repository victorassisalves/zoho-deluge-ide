import sys

with open('ide.js', 'r') as f:
    content = f.read()

# Remove the incorrectly placed line
content = content.replace('window.editor = editor;', '')

# Place it after the editor is created
pattern = 'glyphMargin: true\n        });'
replacement = 'glyphMargin: true\n        });\n        window.editor = editor;'

content = content.replace(pattern, replacement)

with open('ide.js', 'w') as f:
    f.write(content)
