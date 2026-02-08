import re

with open('ide.js', 'r') as f:
    content = f.read()

# 1. Update default fontFamily
search_create = "fontSize: 14,"
replace_create = "fontSize: 14,\n            fontFamily: \"'Fira Code', monospace\","

if search_create in content and "fontFamily" not in content:
    content = content.replace(search_create, replace_create)

# 2. Update storage keys to get
search_get = "chrome.storage.local.get(['saved_deluge_code', 'theme', 'activation_behavior', 'json_mappings', 'left_panel_width', 'right_sidebar_width', 'bottom_panel_height'], (result) => {"
replace_get = "chrome.storage.local.get(['saved_deluge_code', 'theme', 'font_family', 'font_size', 'activation_behavior', 'json_mappings', 'left_panel_width', 'right_sidebar_width', 'bottom_panel_height'], (result) => {"
content = content.replace(search_get, replace_get)

# 3. Apply loaded font settings
apply_settings = """                if (result.theme) monaco.editor.setTheme(result.theme);
                if (result.font_family) {
                    editor.updateOptions({ fontFamily: result.font_family });
                    document.getElementById('font-family-input').value = result.font_family;
                }
                if (result.font_size) {
                    editor.updateOptions({ fontSize: parseInt(result.font_size) });
                    document.getElementById('font-size-input').value = result.font_size;
                }"""
content = content.replace("if (result.theme) monaco.editor.setTheme(result.theme);", apply_settings)

# 4. Update save settings button
search_save = "chrome.storage.local.set({ 'gemini_api_key': key, 'gemini_model': model, 'activation_behavior': document.getElementById('activation-behavior').value }"
replace_save = "chrome.storage.local.set({ 'gemini_api_key': key, 'gemini_model': model, 'font_family': document.getElementById('font-family-input').value, 'font_size': document.getElementById('font-size-input').value, 'activation_behavior': document.getElementById('activation-behavior').value }"
content = content.replace(search_save, replace_save)

# 5. Fix ai-model-selector bug and add font change listeners
font_listeners = """    bind('font-family-input', 'change', (e) => {
        const font = e.target.value;
        if (editor) editor.updateOptions({ fontFamily: font });
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'font_family': font });
        }
    });
    bind('font-size-input', 'change', (e) => {
        const size = parseInt(e.target.value);
        if (editor) editor.updateOptions({ fontSize: size });
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'font_size': size });
        }
    });"""

content = content.replace("bind('theme-selector', 'change'", font_listeners + "\n    bind('theme-selector', 'change'")
content = content.replace("document.getElementById('ai-model-selector').value", "document.getElementById('gemini-model').value")

with open('ide.js', 'w') as f:
    f.write(content)
