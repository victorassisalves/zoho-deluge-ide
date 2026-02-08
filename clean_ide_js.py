import re

with open('ide.js', 'r') as f:
    content = f.read()

# 1. Fix the storage callback in initEditor
# We'll search for the block starting with "chrome.storage.local.get(['saved_deluge_code'"
# and ending with "updateInterfaceMappingsList();\n                }\n            });"

storage_pattern = re.compile(r"chrome\.storage\.local\.get\(\['saved_deluge_code'.*?updateInterfaceMappingsList\(\);\s+\}\s+\}\);", re.DOTALL)
storage_replacement = """chrome.storage.local.get(['saved_deluge_code', 'theme', 'font_family', 'font_size', 'activation_behavior', 'json_mappings', 'left_panel_width', 'right_sidebar_width', 'bottom_panel_height'], (result) => {
                if (result.saved_deluge_code) {
                    try { editor.setValue(result.saved_deluge_code); } catch(e) {}
                }
                if (typeof initApiExplorer === 'function') initApiExplorer();
                if (typeof syncProblemsPanel === 'function') syncProblemsPanel();

                if (result.theme) {
                    try { monaco.editor.setTheme(result.theme); } catch(e) {}
                }
                if (result.font_family && editor) {
                    try {
                        editor.updateOptions({ fontFamily: result.font_family });
                        const fontInput = document.getElementById('font-family-input');
                        if (fontInput) fontInput.value = result.font_family;
                    } catch(e) {}
                }
                if (result.font_size && editor) {
                    try {
                        const fontSize = parseInt(result.font_size);
                        editor.updateOptions({ fontSize: fontSize });
                        const sizeInput = document.getElementById('font-size-input');
                        if (sizeInput) sizeInput.value = fontSize;
                    } catch(e) {}
                }
                if (result.activation_behavior) document.getElementById("activation-behavior").value = result.activation_behavior;
                if (result.bottom_panel_height) {
                    const bottomPanel = document.getElementById('bottom-panel');
                    if (bottomPanel) {
                        bottomPanel.style.height = result.bottom_panel_height;
                        document.documentElement.style.setProperty('--footer-height', result.bottom_panel_height);
                    }
                }
                if (result.left_panel_width) {
                    const leftPanel = document.getElementById('left-panel-content');
                    if (leftPanel) {
                        leftPanel.style.width = result.left_panel_width;
                        leftPanel.style.setProperty('--left-sidebar-width', result.left_panel_width);
                    }
                }
                if (result.right_sidebar_width) {
                    const rightSidebar = document.getElementById("right-sidebar");
                    if (rightSidebar) rightSidebar.style.width = result.right_sidebar_width;
                }
                setTimeout(() => { if (editor) editor.layout(); }, 200);
                if (result.json_mappings) {
                    interfaceMappings = result.json_mappings;
                    window.interfaceMappings = interfaceMappings;
                    updateInterfaceMappingsList();
                }
            });"""

content = storage_pattern.sub(storage_replacement, content)

# 2. Fix the setupEventHandlers function
setup_pattern = re.compile(r"function setupEventHandlers\(\) \{.*?\}\s+function askGemini", re.DOTALL)
setup_replacement = """function setupEventHandlers() {
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    bind('new-btn', 'click', () => {
        if (confirm('Start a new script?')) {
            editor.setValue('// New Zoho Deluge Script\\n\\n');
        }
    });

    bind('save-settings-btn', 'click', () => {
        const key = document.getElementById('gemini-api-key').value;
        const model = document.getElementById('gemini-model').value;
        const behavior = document.getElementById('activation-behavior').value;
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({
                'gemini_api_key': key,
                'gemini_model': model,
                'activation_behavior': behavior
            }, () => {
                showStatus('Settings Saved', 'success');
            });
        }
    });

    bind('font-family-input', 'change', (e) => {
        const font = e.target.value;
        if (editor) {
            try { editor.updateOptions({ fontFamily: font }); } catch(err) {}
        }
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'font_family': font });
        }
    });

    bind('font-size-input', 'change', (e) => {
        const size = parseInt(e.target.value);
        if (editor) {
            try { editor.updateOptions({ fontSize: size }); } catch(err) {}
        }
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'font_size': size });
        }
    });

    bind('theme-selector', 'change', (e) => {
        const theme = e.target.value;
        monaco.editor.setTheme(theme);
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'theme': theme });
        }
    });

    bind('ai-ask-btn', 'click', () => askGemini());
    bind('ai-question', 'keydown', (e) => { if (e.key === 'Enter') askGemini(); });
    bind('ai-explain-btn', 'click', () => explainCode());
}

function askGemini"""

content = setup_pattern.sub(setup_replacement, content)

with open('ide.js', 'w') as f:
    f.write(content)
