with open('deluge-lang.js', 'r') as f:
    content = f.read()

# I'll put it inside the completion provider
search = "const suggestions = ["
replace = "// 1. JSON Autocomplete\n\n                const suggestions = ["

if search in content:
    content = content.replace(search, replace)
    with open('deluge-lang.js', 'w') as f:
        f.write(content)
