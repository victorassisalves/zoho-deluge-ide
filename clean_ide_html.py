import re

with open('ide.html', 'r') as f:
    content = f.read()

# Fix the Settings View in ide.html
settings_pattern = re.compile(r'<div id="view-settings" class="view-content">.*?<div style="margin-top:30px; font-size:11px; color:#888;">', re.DOTALL)
settings_replacement = """<div id="view-settings" class="view-content">
                    <h4>Settings</h4>
                    <div class="setting-item">
                        <label style="font-size:12px; margin-bottom:4px;">Gemini Model:</label>
                        <select id="gemini-model" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Latest)</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Experimental)</option>
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Most Powerful)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Better results)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label style="font-size:12px; margin-bottom:4px;">Gemini API Key:</label>
                        <input type="password" id="gemini-api-key" placeholder="AIZA...">
                        <button id="save-settings-btn" style="margin-top:10px;">Save Configuration</button>
                    </div>

                    <div class="setting-item" style="margin-top:20px;">
                        <label style="font-size:12px; margin-bottom:4px;">Font Family:</label>
                        <input type="text" id="font-family-input" placeholder="'Fira Code', monospace" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                    </div>
                    <div class="setting-item" style="margin-top:10px;">
                        <label style="font-size:12px; margin-bottom:4px;">Font Size:</label>
                        <input type="number" id="font-size-input" value="14" min="8" max="30" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                    </div>

                    <div class="setting-item" style="margin-top:20px;">
                        <label style="font-size:12px; margin-bottom:4px;">Editor Theme:</label>
                        <select id="theme-selector" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                            <option value="vs-dark">Dark (Default)</option>
                            <option value="dracula">Dracula</option>
                            <option value="vs-light">Light</option>
                        </select>
                    </div>

                    <div class="setting-item" style="margin-top:15px; margin-bottom:15px;">
                        <label style="font-size:12px; margin-bottom:4px;">Activation Shortcut Behavior:</label>
                        <select id="activation-behavior" style="width:100%; background:#1e1e1e; color:#ccc; border:1px solid #444; padding:5px;">
                            <option value="new-tab">Open in New Tab</option>
                            <option value="side-panel">Open in Side Panel (if on Zoho)</option>
                            <option value="smart">Smart (Side Panel if on Zoho, else New Tab)</option>
                        </select>
                    </div>

                    <div style="margin-top:30px; font-size:11px; color:#888;">"""

content = settings_pattern.sub(settings_replacement, content)

with open('ide.html', 'w') as f:
    f.write(content)
