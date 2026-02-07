with open('ide.js', 'r') as f:
    lines = f.readlines()

# Fix double declaration and other potential issues at the top
new_lines = []
for line in lines:
    if line.strip() == 'let currentProjectName = "Untitled Project";' or line.strip() == 'let currentProjectUrl = null;':
        continue
    new_lines.append(line)

final_lines = ['let currentProjectUrl = null;\n', 'let currentProjectName = "Untitled Project";\n'] + new_lines

content = "".join(final_lines)

# Robust loadProjectData
old_load = """function loadProjectData() {
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

        if (editor) {
            const lastCodes = result.last_project_code || {};
            const currentVal = editor.getValue();
            if (lastCodes[currentProjectUrl] && (!currentVal || currentVal.trim() === "" || currentVal.startsWith("// Start coding"))) {
                editor.setValue(lastCodes[currentProjectUrl]);
            }
        }

        const projectMappings = result.project_mappings || {};
        jsonMappings = projectMappings[currentProjectUrl] || {};
        updateMappingsList();
    });
}"""

content = content.replace(old_load, new_load)

with open('ide.js', 'w') as f:
    f.write(content)
