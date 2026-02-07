import sys

with open('ide.js', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i in range(len(lines)):
    line = lines[i]
    if "value: '// Start coding in Zoho Deluge..." in line:
        new_lines.append("            value: '// Start coding in Zoho Deluge...\\n\\n',\n")
        # Skip the next 2 lines if they are empty
        if i+1 < len(lines) and lines[i+1].strip() == "":
            skip = True
            continue
    if skip:
        if line.strip() == "":
            continue
        elif line.strip().startswith("',"):
            skip = False
            continue
        else:
            # We reached something else
            skip = False

    new_lines.append(line)

with open('ide.js', 'w') as f:
    f.writelines(new_lines)
