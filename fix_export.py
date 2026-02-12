import re
filepath = 'ide.js'
with open(filepath, 'r') as f:
    content = f.read()

# Find the export block
start_marker = '// Expose functions to window'
end_marker = '})();'
parts = content.split(start_marker)
if len(parts) > 1:
    main_content = parts[0]
    tail = parts[1].split(end_marker)

    # We want to reconstruct the export block correctly
    # Identify all functions defined in the main content
    func_defs = re.findall(r'^(?:async\s+)?function\s+(\w+)', main_content, re.MULTILINE)
    func_defs = list(set(func_defs))

    new_export_block = start_marker + "\n"
    for func in func_defs:
        new_export_block += f"window.{func} = {func};\n"

    content = main_content + new_export_block + end_marker + tail[1] if len(tail) > 1 else main_content + new_export_block + end_marker

with open(filepath, 'w') as f:
    f.write(content)
