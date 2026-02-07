import re

with open('ide.js', 'r') as f:
    content = f.read()

# Update checkConnection to use showStatus
old_check = r"""function checkConnection\(\) \{
    if \(typeof chrome !== "undefined" && chrome\.runtime\) \{
        chrome\.runtime\.sendMessage\(\{ action: "CHECK_CONNECTION" \}, \(response\) => \{
            const statusEl = document\.getElementById\("status-indicator"\);
            if \(statusEl\) \{
                let nextProjectUrl = "global";
                if \(response && response\.connected\) \{
                    isConnected = true;
                    statusEl\.innerText = \(response\.isStandalone \? "Target: " : "Local: "\) \+ \(response\.tabTitle \|\| "Zoho Tab"\);
                    statusEl\.style\.color = "#4ec9b0";
                    window\.currentTargetTab = response;
                    nextProjectUrl = response\.url;
                } else \{
                    isConnected = false;
                    statusEl\.innerText = "Disconnected";
                    statusEl\.style\.color = "#888";
                    nextProjectUrl = "global";
                }"""

new_check = """function checkConnection() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
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
            }"""

content = re.sub(old_check, new_check, content)

with open('ide.js', 'w') as f:
    f.write(content)
