/**
 * Storage Service
 * Handles local and cloud persistence.
 */
import store from './store.js';
import logger from '../utils/logger.js';

export const loadProjectData = () => {
    const projectUrl = store.get('zideProjectUrl');
    if (!projectUrl || typeof chrome === "undefined" || !chrome.storage) return;

    chrome.storage.local.get(["saved_files", "project_notes", "last_project_code", "project_names", "project_mappings"], (result) => {
        const projectNames = result.project_names || {};
        const projectName = projectNames[projectUrl] || "Untitled Project";
        store.set('zideProjectName', projectName);

        const nameInput = document.getElementById("project-name-input");
        if (nameInput) nameInput.value = projectName;

        const notes = result.project_notes || {};
        const notesEl = document.getElementById("project-notes");
        if (notesEl) notesEl.value = notes[projectUrl] || "";

        const editor = store.getEditor();
        if (editor) {
            const lastCodes = result.last_project_code || {};
            const currentVal = editor.getValue();
            if (lastCodes[projectUrl] && (!currentVal || currentVal.trim() === "" || currentVal.startsWith("// Start coding"))) {
                editor.setValue(lastCodes[projectUrl]);
            }
        }

        const projectMappings = result.project_mappings || {};
        store.set('interfaceMappings', projectMappings[projectUrl] || {});

        // Signal that mappings are updated
        window.dispatchEvent(new CustomEvent('zide-mappings-updated'));
    });
};

export const saveLocally = () => {
    const projectUrl = store.get('zideProjectUrl');
    const editor = store.getEditor();
    if (!projectUrl || !editor || typeof chrome === "undefined" || !chrome.storage) return;

    const code = editor.getValue();
    chrome.storage.local.get(["last_project_code"], (result) => {
        const lastCodes = result.last_project_code || {};
        lastCodes[projectUrl] = code;
        chrome.storage.local.set({ 'last_project_code': lastCodes });
    });
};
