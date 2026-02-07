import re

with open('ide.js', 'r') as f:
    content = f.read()

# Fix checkConnection structure
pattern = r'if \(response && response\.connected\) \{(.*?)\s+\} else \{(.*?)\s+if \(nextProjectUrl !== zideProjectUrl\) \{(.*?)\s+\}\s+\}'
# This might be too complex for a single regex due to nested braces.

# Let's try a simpler approach: replace the whole checkConnection function body
new_body = """    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, (response) => {
            let nextProjectUrl = "global";
            if (response && response.connected) {
                isConnected = true;
                const msg = (response.isStandalone ? "Connected to Target: " : "Connected Local: ") + (response.tabTitle || "Zoho Tab");
                showStatus(msg, "success");
                window.currentTargetTab = response;
                nextProjectUrl = response.url;
            } else {
                isConnected = false;
                showStatus("Disconnected from Zoho", "info");
                nextProjectUrl = "global";
            }

            if (nextProjectUrl !== zideProjectUrl) {
                // Context switch detected
                if (zideProjectUrl && editor && editor.getValue().trim() !== "" && !editor.getValue().startsWith("// Start coding")) {
                    saveLocally();
                }
                zideProjectUrl = nextProjectUrl;
                loadProjectData();
            }
        });
    }"""

# Find the function and replace its content
pattern = r'function checkConnection\(\) \{(.*?)\n\}'
# Using flags=re.DOTALL to match across lines
content = re.sub(r'function checkConnection\(\) \{.*?\}\n\nfunction loadProjectData',
                 'function checkConnection() {\n' + new_body + '\n}\n\nfunction loadProjectData',
                 content, flags=re.DOTALL)

with open('ide.js', 'w') as f:
    f.write(content)
