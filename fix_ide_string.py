import sys

with open('ide.js', 'r') as f:
    content = f.read()

# Fix the broken string with actual newlines
import re
pattern = r"value: '// Start coding in Zoho Deluge\.\.\.\s*\n\n'"
# Actually, the sed output showed actual newlines.
# Let's use a more robust replacement.

bad_string_pattern = r"value: '// Start coding in Zoho Deluge\.\.\.\s*\n\s*\n\s*'"
content = re.sub(bad_string_pattern, "value: '// Start coding in Zoho Deluge...\\n\\n'", content)

with open('ide.js', 'w') as f:
    f.write(content)
