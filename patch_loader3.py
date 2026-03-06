import re
with open('app/loader.js', 'r') as f:
    content = f.read()

# Fix the broken syntax
bad_syntax = """        `], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }
};"""

content = content.replace(bad_syntax, "")

with open('app/loader.js', 'w') as f:
    f.write(content)
