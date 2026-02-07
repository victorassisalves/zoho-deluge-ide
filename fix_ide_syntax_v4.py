import sys

with open('ide.js', 'r') as f:
    content = f.read()

import re

# Find the entire monaco.editor.create block
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

# First, clean up any existing "window.editor = editor;" that might be misplaced
content = content.replace('window.editor = editor;', '')

# Now apply the replacement
content = re.sub(pattern, replacement, content)

with open('ide.js', 'w') as f:
    f.write(content)
