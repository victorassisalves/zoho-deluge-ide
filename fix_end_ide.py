with open('ide.js', 'r') as f:
    lines = f.readlines()

# Look for the last few lines
# 964: });
# 965:
# 966: });
# 967:
# 968:     // Expose internal functions to window for Cloud UI

new_lines = []
for line in lines:
    if line.strip() == '});' and len(new_lines) > 0 and new_lines[-1].strip() == '});':
        # Skip duplicate closing
        continue
    new_lines.append(line)

# Let's be more specific. I'll just rewrite the end.
content = "".join(lines)
import re
pattern = r'\}\);\s*\}\);\s*// Expose internal functions'
content = re.sub(pattern, '});\n\n    // Expose internal functions', content)

with open('ide.js', 'w') as f:
    f.write(content)
