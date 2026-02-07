with open('ide.js', 'r') as f:
    content = f.read()

# Wrap in IIFE
new_content = "(function() {\n" + content + "\n})();"

with open('ide.js', 'w') as f:
    f.write(new_content)
