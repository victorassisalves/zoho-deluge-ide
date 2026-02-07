import sys

with open('ide.js', 'r') as f:
    content = f.read()

# Fix the misplaced window.editor = editor;
content = content.replace('window.editor = editor;', '')
content = content.replace('editor = monaco.editor.create(container, {', 'editor = monaco.editor.create(container, {')
# Re-insert after the block
if 'editor = monaco.editor.create(container, {' in content:
    # Find the end of the create() call. It's roughly 15-20 lines down.
    # Actually, let's just use a smarter replacement.
    pass

# Direct replacement of the broken block
broken = """        editor = monaco.editor.create(container, {

            value: '// Start coding in Zoho Deluge...\n\n',"""
# I noticed multiple spaces/newlines might differ, so let's be careful.
content = content.replace('window.editor = editor;', '')

with open('ide.js', 'w') as f:
    f.write(content)

# Add it correctly after assignment
with open('ide.js', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if 'editor = monaco.editor.create(container,' in line:
        # We want to wait until the end of the statement, but for now just after assignment is fine if we can find it.
        pass

# Let's try again with a simpler approach for ide.js
