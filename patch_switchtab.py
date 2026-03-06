import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Let's search for how files are loaded or tabs are switched.
# Looking for "function switchTab" or "async switchTab" or "async function loadTab"
# We can also just run grep.
