import json

with open('manifest.json', 'r') as f:
    manifest = json.load(f)

# Update content script to use content-loader.js
for script in manifest['content_scripts']:
    if 'src/main.js' in script['js']:
        script['js'] = ['src/content-loader.js']

# Ensure src/content-loader.js is in web_accessible_resources?
# Actually src/main.js needs to be in WAR, which it is (src/**/*).
# content-loader.js is the content script, so it doesn't need to be in WAR necessarily,
# but it's good practice if we were dynamically importing it too.
# The dynamic import target (src/main.js) MUST be in WAR.

with open('manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
