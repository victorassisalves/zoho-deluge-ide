import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

# Add ignoreCase: true and update keywords
search = "monaco.languages.setMonarchTokensProvider('deluge', {"
replace = "monaco.languages.setMonarchTokensProvider('deluge', {\n            ignoreCase: true,"

if search in content and "ignoreCase: true" not in content:
    content = content.replace(search, replace)

# Update keywords list
search_keywords = "'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list': 'keyword'"
replace_keywords = "'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list|post|get|put|delete|patch': 'keyword'"

content = content.replace(search_keywords, replace_keywords)

with open('deluge-lang.js', 'w') as f:
    f.write(content)
