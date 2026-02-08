import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

# Current state:
# 'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list|post|get|put|delete|patch': 'keyword',
# 'zoho|thisapp|standalone|input': 'type',

# New state:
# 'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw': 'keyword',
# 'void|string|int|decimal|boolean|map|list|zoho|thisapp|standalone|input|post|get|put|delete|patch': 'type',

# Wait, post|get|put|delete|patch are more like constants/keywords than types.
# But string|int|decimal|boolean|map|list are definitely types.

content = content.replace(
    "'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list|post|get|put|delete|patch': 'keyword'",
    "'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|null|true|false': 'keyword'"
)

content = content.replace(
    "'zoho|thisapp|standalone|input': 'type'",
    "'void|string|int|decimal|boolean|map|list|zoho|thisapp|standalone|input|post|get|put|delete|patch': 'type'"
)

with open('deluge-lang.js', 'w') as f:
    f.write(content)
