import sys
import re

with open('ide.js', 'r') as f:
    content = f.read()

# Add annotation rule to the dracula theme
search = "{ token: 'comment', foreground: '6272a4' },"
replace = "{ token: 'comment', foreground: '6272a4' },\n                { token: 'annotation', foreground: 'ff79c6', fontStyle: 'bold' },"

if search in content:
    updated_content = content.replace(search, replace)
    with open('ide.js', 'w') as f:
        f.write(updated_content)
    print("Theme updated")
else:
    print("Search string not found")
