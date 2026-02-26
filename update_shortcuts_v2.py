import re

file_path = 'app/core/editor-controller.js'

with open(file_path, 'r') as f:
    content = f.read()

# We will inject addCommand directly after the addAction blocks or inside initEditor.
# We also add the secondary keybinding.

new_shortcut_logic = r"""
        // 1. Standard Action (High Priority Context)
        const pullAction = {
            id: 'zide-pull-zoho',
            label: 'Pull from Zoho',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
                monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL // Alternative: Ctrl+Shift+L
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => {
                console.log('[ZohoIDE] Action Triggered: Pull from Zoho');
                pullFromZoho();
            }
        };
        editor.addAction(pullAction);

        // 2. Low-Level Command Override (Nuclear Option)
        // This attempts to intercept the key before the action service processes it.
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
            () => {
                console.log('[ZohoIDE] Command Triggered: Pull from Zoho');
                pullFromZoho();
            }
        );
"""

# Helper to remove old pull action
# We look for the block we added previously
old_pull_regex = r"editor\.addAction\(\{\s+id: 'zide-pull-zoho'[\s\S]+?\}\);"

if re.search(old_pull_regex, content):
    content = re.sub(old_pull_regex, "", content)
    # Insert new logic where the old one was (or around where other shortcuts are)
    # We'll just put it back after "Keyboard Shortcuts & Overrides"
    start_marker = "// Keyboard Shortcuts & Overrides"
    start_idx = content.find(start_marker)
    if start_idx != -1:
        new_content = content[:start_idx + len(start_marker)] + "\n" + new_shortcut_logic + content[start_idx + len(start_marker):]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Updated editor-controller.js with addCommand and secondary shortcut.")
    else:
        print("Could not find marker.")
else:
    print("Could not find old pull action to replace, inserting new...")
    # Just insert
    start_marker = "// Keyboard Shortcuts & Overrides"
    start_idx = content.find(start_marker)
    if start_idx != -1:
        new_content = content[:start_idx + len(start_marker)] + "\n" + new_shortcut_logic + content[start_idx + len(start_marker):]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Inserted new shortcuts.")
