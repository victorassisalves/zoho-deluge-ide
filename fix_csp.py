with open('ide.html', 'r') as f:
    html = f.read()

import re
# Remove the inline script
html = re.sub(r'<script>\s*if \(window\.location\.search\.includes\("mode=sidepanel"\) \|\| window\.location\.hash\.includes\("sidepanel"\)\) \{\s*document\.documentElement\.classList\.add\("sidepanel-mode"\);\s*\}\s*</script>', '', html)

with open('ide.html', 'w') as f:
    f.write(html)

with open('loader-init.js', 'r') as f:
    loader = f.read()

# Add detection at the top of loader-init.js
detection = """if (window.location.search.includes("mode=sidepanel") || window.location.hash.includes("sidepanel")) {
    document.documentElement.classList.add("sidepanel-mode");
}

"""
loader = detection + loader

with open('loader-init.js', 'w') as f:
    f.write(loader)
