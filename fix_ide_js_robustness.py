import re

with open('ide.js', 'r') as f:
    content = f.read()

# Make the initialization more robust
robust_init = """                if (result.saved_deluge_code) {
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
                }"""

# Replace the messy part
pattern = re.compile(r"if \(result\.saved_deluge_code\) editor\.setValue\(result\.saved_deluge_code\);.*?if \(result\.font_size\) \{.*?\}", re.DOTALL)
content = pattern.sub(robust_init, content)

# Also make the event listeners robust
font_listeners = """    bind('font-family-input', 'change', (e) => {
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
    });"""

# Replace the listeners part if it exists
pattern_listeners = re.compile(r"bind\('font-family-input', 'change',.*?\}\);", re.DOTALL)
content = pattern_listeners.sub(font_listeners, content)

with open('ide.js', 'w') as f:
    f.write(content)
