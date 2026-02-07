import re

with open('ide.js', 'r') as f:
    content = f.read()

# Add showStatus function
show_status_func = """
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById("status-indicator");
    if (statusEl) {
        statusEl.innerText = message;
        statusEl.style.color = type === 'success' ? '#4ec9b0' : (type === 'error' ? '#f44747' : '#888');
    }
    log(type, message);
}
"""

# Insert showStatus before log function
content = content.replace('function log(type, message) {', show_status_func + '\nfunction log(type, message) {')

with open('ide.js', 'w') as f:
    f.write(content)
