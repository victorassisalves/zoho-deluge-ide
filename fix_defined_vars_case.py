import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

# Make definedVars.add use lowercase
content = content.replace("definedVars.add(paramName);", "definedVars.add(paramName.toLowerCase());")
content = content.replace("definedVars.add(pMatch[1]);", "definedVars.add(pMatch[1].toLowerCase());")
content = content.replace("definedVars.add(match[1]);", "definedVars.add(match[1].toLowerCase());")

# Make definedVars.has use lowercase
content = content.replace("if (definedVars.has(word)) return;", "if (definedVars.has(word.toLowerCase())) return;")

with open('deluge-lang.js', 'w') as f:
    f.write(content)
