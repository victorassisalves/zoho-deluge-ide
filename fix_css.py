import re

with open('ide.css', 'r') as f:
    content = f.read()

# Restore sidebar
content = content.replace('html.sidepanel-mode #sidebar {\n    display: none !important;\n}',
                          'html.sidepanel-mode #sidebar {\n    width: 40px !important;\n}')

# Restore panels
content = content.replace('html.sidepanel-mode .sidebar-panel,\nhtml.sidepanel-mode #right-sidebar {\n    overflow: hidden;\n    display: none !important;\n}',
                          'html.sidepanel-mode .sidebar-panel,\nhtml.sidepanel-mode #right-sidebar {\n    display: flex !important;\n    width: 180px !important;\n}')

with open('ide.css', 'w') as f:
    f.write(content)
