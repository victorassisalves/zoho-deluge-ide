with open('ide.js', 'r') as f:
    content = f.read()

content = content.replace('let currentProjectUrl = null;', 'var zideProjectUrl = null;')
content = content.replace('let currentProjectName = "Untitled Project";', 'var zideProjectName = "Untitled Project";')

content = content.replace('currentProjectUrl', 'zideProjectUrl')
content = content.replace('currentProjectName', 'zideProjectName')

with open('ide.js', 'w') as f:
    f.write(content)
