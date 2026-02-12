// src/ui/SettingsManager.js
import store from "../core/store.js";

class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
    }

    bindEvents() {
        const saveBtn = document.getElementById("save-settings-btn");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.saveSettings());
        }

        const themeSelector = document.getElementById("theme-selector");
        if (themeSelector) {
            themeSelector.addEventListener("change", (e) => {
                const theme = e.target.value;
                if (window.monaco) window.monaco.editor.setTheme(theme);
                if (typeof chrome !== "undefined" && chrome.storage) {
                    chrome.storage.local.set({ "theme": theme });
                }
            });
        }

        const fontSizeInput = document.getElementById("editor-font-size");
        if (fontSizeInput) {
            fontSizeInput.addEventListener("input", (e) => {
                let fs = parseInt(e.target.value);
                if (fs) {
                    if (fs > 30) fs = 30;
                    if (fs < 8) fs = 8;
                    // Dispatch event for EditorWrapper
                    window.dispatchEvent(new CustomEvent("editor-font-change", { detail: { fontSize: fs } }));

                    if (typeof chrome !== "undefined" && chrome.storage) {
                        chrome.storage.local.set({ "font_size": fs });
                    }
                }
            });
        }

        const activationBehavior = document.getElementById("activation-behavior");
        if (activationBehavior) {
            activationBehavior.addEventListener("change", (e) => {
                const behavior = e.target.value;
                if (typeof chrome !== "undefined" && chrome.storage) {
                    chrome.storage.local.set({ "activation_behavior": behavior });
                }
            });
        }
    }

    saveSettings() {
        const key = document.getElementById("gemini-api-key").value;
        const model = document.getElementById("gemini-model").value;
        let fontSize = document.getElementById("editor-font-size").value;
        const behavior = document.getElementById("activation-behavior").value;

        // Handle font size validation
        let fs = parseInt(fontSize);
        if (fs) {
            if (fs > 30) fs = 30;
            if (fs < 8) fs = 8;
            fontSize = fs;
            document.getElementById("editor-font-size").value = fs;
            window.dispatchEvent(new CustomEvent("editor-font-change", { detail: { fontSize: fs } }));
        }

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({
                "gemini_api_key": key,
                "gemini_model": model,
                "activation_behavior": behavior,
                "font_size": fontSize
            }, () => {
                // log success
                console.log("Settings saved.");
                alert("Settings saved.");
            });
        }
    }

    loadSettings() {
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(["gemini_api_key", "gemini_model", "activation_behavior", "font_size", "theme"], (result) => {
                if (result.gemini_api_key) document.getElementById("gemini-api-key").value = result.gemini_api_key;
                if (result.gemini_model) document.getElementById("gemini-model").value = result.gemini_model;
                if (result.activation_behavior) document.getElementById("activation-behavior").value = result.activation_behavior;
                if (result.font_size) {
                     document.getElementById("editor-font-size").value = result.font_size;
                     // EditorWrapper will load initial font size from storage too or we can dispatch here
                     // But EditorWrapper might not be ready yet if loaded in parallel.
                     // EditorWrapper handles its own initial load.
                }
                if (result.theme) {
                    document.getElementById("theme-selector").value = result.theme;
                }
            });
        }
    }
}

export default new SettingsManager();
