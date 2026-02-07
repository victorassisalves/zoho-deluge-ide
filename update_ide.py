import re

with open('ide.js', 'r') as f:
    content = f.read()

# Update loadProjectData
load_old = r"""function loadProjectData\(\) \{
    if \(!currentProjectUrl \|\| typeof chrome === "undefined" \|\| !chrome.storage\) return;
    chrome.storage.local.get\(\["saved_files", "project_notes", "last_project_code"\], \(result\) => \{
        const allFiles = result.saved_files \|\| \[\];
        const projectFiles = allFiles.filter\(f => f.projectUrl === currentProjectUrl \|\| \(!f.projectUrl && currentProjectUrl === "global"\)\);
        updateSavedFilesList\(projectFiles\);

        const notes = result.project_notes \|\| \{\};
        const notesEl = document.getElementById\("project-notes"\);
        if \(notesEl\) notesEl.value = notes\[currentProjectUrl\] \|\| "";

        const lastCodes = result.last_project_code \|\| \{\};
        if \(lastCodes\[currentProjectUrl\] && !editor.getValue\(\).trim\(\)\) \{
            editor.setValue\(lastCodes\[currentProjectUrl\]\);
        \}
    \}\);
\}"""

load_new = """function loadProjectData() {
    if (!currentProjectUrl || typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["saved_files", "project_notes", "last_project_code", "project_names", "project_mappings"], (result) => {
        const allFiles = result.saved_files || [];
        const projectFiles = allFiles.filter(f => f.projectUrl === currentProjectUrl || (!f.projectUrl && currentProjectUrl === "global"));
        updateSavedFilesList(projectFiles);

        const projectNames = result.project_names || {};
        currentProjectName = projectNames[currentProjectUrl] || "Untitled Project";
        const nameInput = document.getElementById("project-name-input");
        if (nameInput) nameInput.value = currentProjectName;

        const notes = result.project_notes || {};
        const notesEl = document.getElementById("project-notes");
        if (notesEl) notesEl.value = notes[currentProjectUrl] || "";

        const lastCodes = result.last_project_code || {};
        const currentVal = editor.getValue();
        if (lastCodes[currentProjectUrl] && (!currentVal || currentVal.trim() === "" || currentVal.startsWith("// Start coding"))) {
            editor.setValue(lastCodes[currentProjectUrl]);
        }

        const projectMappings = result.project_mappings || {};
        jsonMappings = projectMappings[currentProjectUrl] || {};
        updateMappingsList();
    });
}"""

content = re.sub(load_old, load_new, content)

# Update setupEventHandlers
event_old = r"bind\('save-btn', 'click', saveLocally\);"
event_new = """bind('save-btn', 'click', saveLocally);

    bind('project-name-input', 'input', (e) => {
        currentProjectName = e.target.value;
        if (currentProjectUrl) {
            chrome.storage.local.get(['project_names'], (result) => {
                const names = result.project_names || {};
                names[currentProjectUrl] = currentProjectName;
                chrome.storage.local.set({ 'project_names': names });
            });
        }
    });"""

content = content.replace(event_old, event_new)

# Update saveMapping
save_old = r"""function saveMapping\(name, jsonStr\) \{
    try \{
        const obj = JSON.parse\(jsonStr\);
        jsonMappings\[name\] = obj;
        if \(typeof chrome !== "undefined" && chrome.storage\) \{
            chrome.storage.local.set\(\{ 'json_mappings': jsonMappings \}\);
        \}
        updateMappingsList\(\);
    \} catch \(e\) \{ alert\('Invalid JSON: ' \+ e.message\); \}
\}"""

save_new = """function saveMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        jsonMappings[name] = obj;
        if (typeof chrome !== "undefined" && chrome.storage) {
            if (currentProjectUrl) {
                chrome.storage.local.get(['project_mappings'], (result) => {
                    const projectMappings = result.project_mappings || {};
                    projectMappings[currentProjectUrl] = jsonMappings;
                    chrome.storage.local.set({ 'project_mappings': projectMappings });
                });
            } else {
                chrome.storage.local.set({ 'json_mappings': jsonMappings });
            }
        }
        updateMappingsList();
    } catch (e) { alert('Invalid JSON: ' + e.message); }
}"""

content = re.sub(save_old, save_new, content)

with open('ide.js', 'w') as f:
    f.write(content)
