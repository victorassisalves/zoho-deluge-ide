import re

with open('ide.js', 'r') as f:
    content = f.read()

# Pattern to find snippet assignments with literal newlines and replace quotes with backticks
# Note: This is a bit tricky with regex. I'll search for 'snippet = "' and then everything until '";'

def fix_snippet(match):
    snippet_content = match.group(1)
    # Replace the outer quotes with backticks
    return f'snippet = `{snippet_content}`'

# This matches snippet = "..." where the content can span multiple lines
# We need to be careful not to match too much.
# The snippets are inside the switch statement.
fixed_content = re.sub(r'snippet = "([^"]*?)"', fix_snippet, content, flags=re.DOTALL)

with open('ide.js', 'w') as f:
    f.write(fixed_content)
