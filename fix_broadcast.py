import re

with open('background.js', 'r') as f:
    content = f.read()

new_broadcast = """function broadcastToIDE(message) {
    // Send to extension pages (IDE tab or side panel iframe)
    chrome.runtime.sendMessage(message);
}"""

content = re.sub(r'function broadcast_placeholder\(message\) \{.*?\}', new_broadcast, content, flags=re.DOTALL)

with open('background.js', 'w') as f:
    f.write(content)
