import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Make sure updateInterfaceMappingsList() is called correctly
# It's defined at the top level in editor-controller, so it's accessible.
# Let's verify we didn't duplicate `window.interfaceMappings` assignment.

if "window.interfaceMappings[`creator_schema_${" in content:
    print("Looks good")
