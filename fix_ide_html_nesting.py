with open('ide.html', 'r') as f:
    content = f.read()

# Clean up the double setting-item div
messy = """                    <div class="setting-item" style="margin-top:20px;">
                                            <div class="setting-item" style="margin-top:20px;">"""
clean = """                    <div class="setting-item" style="margin-top:20px;">"""

content = content.replace(messy, clean)

with open('ide.html', 'w') as f:
    f.write(content)
