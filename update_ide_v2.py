import os

with open('ide.js', 'r') as f:
    content = f.read()

# Fix loadProjectData
old_load = """function loadProjectData() {
    if (!currentProjectUrl || typeof chrome === "undefined" || !chrome.storage) return;
    if (!currentProjectUrl || typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["saved_files", "project_notes", "last_project_code"], (result) => {
        const allFiles = result.saved_files || [];
        const projectFiles = allFiles.filter(f => f.projectUrl === currentProjectUrl || (!f.projectUrl && currentProjectUrl === "global"));
        updateSavedFilesList(projectFiles);

        const notes = result.project_notes || {};
        const notesEl = document.getElementById("project-notes");
        if (notesEl) notesEl.value = notes[currentProjectUrl] || "";

        const lastCodes = result.last_project_code || {};
        if (lastCodes[currentProjectUrl] && !editor.getValue().trim()) {
            editor.setValue(lastCodes[currentProjectUrl]);
        }
    });
}"""

new_load = """function loadProjectData() {
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

content = content.replace(old_load, new_load)

# Fix setupEventHandlers (add project-name-input)
old_save_btn = "bind('save-btn', 'click', saveLocally);"
new_save_btn = """bind('save-btn', 'click', saveLocally);

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

if new_save_btn not in content:
    content = content.replace(old_save_btn, new_save_btn)

with open('ide.js', 'w') as f:
    f.write(content)
