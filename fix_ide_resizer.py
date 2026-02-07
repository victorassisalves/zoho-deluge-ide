import sys

with open('ide.js', 'r') as f:
    content = f.read()

# 1. Update storage load in initEditor
old_load = "chrome.storage.local.get(['saved_deluge_code', 'theme', 'json_mappings'], (result) => {"
new_load = "chrome.storage.local.get(['saved_deluge_code', 'theme', 'json_mappings', 'left_panel_width'], (result) => {"
content = content.replace(old_load, new_load)

extra_load_logic = """                if (result.left_panel_width) {
                    const leftPanel = document.getElementById('left-panel-content');
                    if (leftPanel) {
                        leftPanel.style.width = result.left_panel_width;
                        leftPanel.style.setProperty('--left-sidebar-width', result.left_panel_width);
                        setTimeout(() => { if (editor) editor.layout(); }, 100);
                    }
                }"""
content = content.replace("if (result.json_mappings) {", extra_load_logic + "\n                if (result.json_mappings) {")

# 2. Replace Right Resizer logic with both
resizer_block_start = "// Resizing Right Sidebar"
resizer_block_end = "// JSON Search"

start_idx = content.find(resizer_block_start)
end_idx = content.find(resizer_block_end)

if start_idx != -1 and end_idx != -1:
    new_resizer_logic = """// Resizing Sidebars
let isResizingRight = false;
let isResizingLeft = false;

document.getElementById('left-resizer')?.addEventListener('mousedown', (e) => {
    isResizingLeft = true;
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
});

document.getElementById('right-sidebar-resizer')?.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
});

window.addEventListener('mousemove', (e) => {
    if (isResizingRight) {
        const sidebar = document.getElementById('right-sidebar');
        if (!sidebar) return;
        const width = window.innerWidth - e.clientX;
        if (width > 50 && width < 600) {
            sidebar.classList.remove('collapsed');
            const icon = document.getElementById('toggle-right-sidebar');
            if (icon) icon.innerText = '▶';
            sidebar.style.width = width + 'px';
            if (editor) editor.layout();
        }
    } else if (isResizingLeft) {
        const leftPanel = document.getElementById('left-panel-content');
        if (!leftPanel) return;
        const sidebarWidth = document.getElementById('sidebar')?.offsetWidth || 48;
        const width = e.clientX - sidebarWidth;
        if (width > 150 && width < 600) {
            leftPanel.style.width = width + 'px';
            leftPanel.style.setProperty('--left-sidebar-width', width + 'px');
            if (editor) editor.layout();
        }
    }
});

window.addEventListener('mouseup', () => {
    if (isResizingLeft) {
        const leftPanel = document.getElementById('left-panel-content');
        if (leftPanel && typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'left_panel_width': leftPanel.style.width });
        }
    }
    isResizingRight = false;
    isResizingLeft = false;
    document.body.style.userSelect = 'auto';
    document.body.classList.remove('resizing');
});

"""
    content = content[:start_idx] + new_resizer_logic + content[end_idx:]

with open('ide.js', 'w') as f:
    f.write(content)
