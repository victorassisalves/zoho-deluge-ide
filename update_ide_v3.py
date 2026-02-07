with open('ide.js', 'r') as f:
    content = f.read()

# Update checkConnection
old_check = """function checkConnection() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, (response) => {
            const statusEl = document.getElementById("status-indicator");
            if (statusEl) {
                if (response && response.connected) {
                    isConnected = true;
                    statusEl.innerText = (response.isStandalone ? "Target: " : "Local: ") + (response.tabTitle || "Zoho Tab");
                    statusEl.style.color = "#4ec9b0";
                    window.currentTargetTab = response;
                    currentProjectUrl = response.url;
                } else {
                    isConnected = false;
                    statusEl.innerText = "Disconnected";
                    statusEl.style.color = "#888";
                    currentProjectUrl = "global";
                }
                if (currentProjectUrl !== lastProjectUrl) {
                    lastProjectUrl = currentProjectUrl;
                    loadProjectData();
                }
            }
        });
    }
}"""

new_check = """function checkConnection() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, (response) => {
            const statusEl = document.getElementById("status-indicator");
            if (statusEl) {
                let nextProjectUrl = "global";
                if (response && response.connected) {
                    isConnected = true;
                    statusEl.innerText = (response.isStandalone ? "Target: " : "Local: ") + (response.tabTitle || "Zoho Tab");
                    statusEl.style.color = "#4ec9b0";
                    window.currentTargetTab = response;
                    nextProjectUrl = response.url;
                } else {
                    isConnected = false;
                    statusEl.innerText = "Disconnected";
                    statusEl.style.color = "#888";
                    nextProjectUrl = "global";
                }

                if (nextProjectUrl !== currentProjectUrl) {
                    // Context switch detected
                    if (currentProjectUrl && editor && editor.getValue().trim() !== "" && !editor.getValue().startsWith("// Start coding")) {
                        saveLocally();
                    }
                    currentProjectUrl = nextProjectUrl;
                    loadProjectData();
                }
            }
        });
    }
}"""

content = content.replace(old_check, new_check)

# Update askGemini to handle default model
content = content.replace('result.gemini_model || "gemini-1.5-flash"', 'result.gemini_model || "gemini-3-flash-preview"')

with open('ide.js', 'w') as f:
    f.write(content)
