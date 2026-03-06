import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Fix updateInterfaceMappingsList to not crash if the sidebar panel isn't loaded
old_function = """function updateInterfaceMappingsList() {
    const list = document.getElementById('interface-mappings-list');
    list.innerHTML = '';"""

new_function = """function updateInterfaceMappingsList() {
    const list = document.getElementById('interface-mappings-list');
    if (!list) return; // Wait until UI is ready
    list.innerHTML = '';"""

content = content.replace(old_function, new_function)

# In the METADATA_INTERCEPTED listener, check if the UI is ready
old_ui_check = """                                    if (typeof updateInterfaceMappingsList === 'function') {
                                        updateInterfaceMappingsList();
                                    }"""
new_ui_check = """                                    if (typeof updateInterfaceMappingsList === 'function') {
                                        try { updateInterfaceMappingsList(); } catch (e) {}
                                    }"""
content = content.replace(old_ui_check, new_ui_check)

with open(controller_file, "w") as f:
    f.write(content)
print("Patched updateInterfaceMappingsList")
