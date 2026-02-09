content = open('ide.js').read()
old = "if (e.ctrlKey && e.shiftKey) {"
new = "if ((e.ctrlKey || e.metaKey) && e.shiftKey) {"
content = content.replace(old, new)
with open('ide.js', 'w') as f:
    f.write(content)
