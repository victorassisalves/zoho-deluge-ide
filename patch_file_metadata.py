import re
with open('app/core/editor-controller.js', 'r') as f:
    content = f.read()

# Let's find where a file is saved into the database or when LINK_TAB_SUCCESS happens.
if "LINK_TAB_SUCCESS" in content:
    print("Found LINK_TAB_SUCCESS in controller")
