import sys

with open('ide.js', 'r') as f:
    content = f.read()

# The error was:
# editor = monaco.editor.create(container, {
# window.editor = editor;
#    value: ...

# Let's just fix the whole monaco.editor.create block
import re

pattern = r'editor = monaco\.editor\.create\(container, \{[\s\S]*?glyphMargin: true\s*\}\);'
replacement = """editor = monaco.editor.create(container, {
            value: '// Start coding in Zoho Deluge...\\n\\n',
            language: 'deluge',
            theme: 'dracula',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            glyphMargin: true
        });
        window.editor = editor;"""

content = re.sub(pattern, replacement, content)

# Also ensure window.editor = editor; isn't duplicated anywhere else nearby
content = content.replace('window.editor = editor;\n        window.editor = editor;', 'window.editor = editor;')

with open('ide.js', 'w') as f:
    f.write(content)
