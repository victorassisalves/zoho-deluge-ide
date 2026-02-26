import re

file_path = 'app/core/editor-controller.js'

with open(file_path, 'r') as f:
    content = f.read()

# Replace the addAction for pull with addCommand for higher priority override
# Monaco addCommand is lower level but addAction is usually sufficient if context is right.
# However, for Cmd+Shift+P (Quick Command), we might need to be aggressive.

# We will add a check for the specific keybinding and ensure it runs.
# Also adding debug logging.

new_action = r"""
        // Keyboard Shortcuts & Overrides

        // Force override Command Palette (Cmd+Shift+P) for Pull
        // We use a high priority context key or just addAction.
        // Note: Monaco's default Command Palette is F1 or Cmd+Shift+P.
        editor.addAction({
            id: 'zide-pull-zoho',
            label: 'Pull from Zoho',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP
            ],
            // A precondition that is always true but might help override default
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => {
                console.log('[ZohoIDE] Shortcut Triggered: Pull from Zoho');
                pullFromZoho();
            }
        });

        editor.addAction({
            id: 'zide-save-local',
            label: 'Save Locally (Dexie)',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => {
                console.log('[ZohoIDE] Manual Save (Dexie)');
                saveToDexie(false);
            }
        });

        editor.addAction({
            id: 'zide-push-zoho',
            label: 'Push to Zoho',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            run: () => { pushToZoho(true); }
        });

        editor.addAction({
            id: 'zide-push-execute-zoho',
            label: 'Push and Execute',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: () => { pushToZoho(true, true); }
        });
"""

# Regex to find the block of addAction calls
pattern = r"// Keyboard Shortcuts & Overrides\s+editor\.addAction\(\{.*?\}\);\s+editor\.addAction\(\{.*?\}\);\s+editor\.addAction\(\{.*?\}\);\s+editor\.addAction\(\{.*?\}\);"
# The pattern above is too brittle for multiline. Let's replace the whole block by finding start and end.

# Finding the start of shortcuts
start_marker = "// Keyboard Shortcuts & Overrides"
# Finding the start of Bus.listen which follows
end_marker = "// Listen for Commands via Bus"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_action + "\n\n        " + content[end_idx:]
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully updated shortcuts in editor-controller.js")
else:
    print("Could not find shortcut block to replace.")
    # Fallback to manual write if regex fails (likely due to previous edits)
    print("Start:", start_idx, "End:", end_idx)
