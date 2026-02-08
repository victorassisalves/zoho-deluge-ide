with open('ide.html', 'r') as f:
    content = f.read()

# Add Fira Code font
google_font = '<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;700&display=swap" rel="stylesheet">\n'
if 'fonts.googleapis.com' not in content:
    content = content.replace('<link rel="stylesheet" href="ide.css">', '<link rel="stylesheet" href="ide.css">\n    ' + google_font)

# Add Font Settings
font_settings = """                    <div class="setting-item" style="margin-top:20px;">
                        <label style="font-size:12px; margin-bottom:4px;">Font Family:</label>
                        <input type="text" id="font-family-input" placeholder="'Fira Code', monospace" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                    </div>
                    <div class="setting-item" style="margin-top:10px;">
                        <label style="font-size:12px; margin-bottom:4px;">Font Size:</label>
                        <input type="number" id="font-size-input" value="14" min="8" max="30" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                    </div>"""

if 'id="font-family-input"' not in content:
    content = content.replace('<label style="font-size:12px; margin-bottom:4px;">Editor Theme:</label>', font_settings + '\n                        <label style="font-size:12px; margin-bottom:4px; margin-top:20px; display:block;">Editor Theme:</label>')

with open('ide.html', 'w') as f:
    f.write(content)
