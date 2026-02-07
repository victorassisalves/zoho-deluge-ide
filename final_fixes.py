with open('ide.js', 'r') as f:
    content = f.read()

# Improve pullFromZoho
old_pull = """function pullFromZoho() {
    log('System', 'Pulling code from Zoho...');
    if (typeof chrome !== "undefined" && chrome.runtime) {"""

new_pull = """function pullFromZoho() {
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
        return;
    }
    log('System', 'Pulling code from Zoho...');
    if (typeof chrome !== "undefined" && chrome.runtime) {"""

content = content.replace(old_pull, new_pull)

# Improve pushToZoho
old_push = """function pushToZoho(triggerSave = false, triggerExecute = false) {
    const code = editor.getValue();
    log('System', 'Pushing code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {"""

new_push = """function pushToZoho(triggerSave = false, triggerExecute = false) {
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Sync/Execute failed.');
        return;
    }
    const code = editor.getValue();
    log('System', 'Pushing code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {"""

content = content.replace(old_push, new_push)

# Fix deletion in updateMappingsList
old_delete = """                delete jsonMappings[name];
                if (typeof chrome !== "undefined" && chrome.storage) {
                    chrome.storage.local.set({ 'json_mappings': jsonMappings });
                }"""

new_delete = """                delete jsonMappings[name];
                if (typeof chrome !== "undefined" && chrome.storage) {
                    if (currentProjectUrl) {
                        chrome.storage.local.get(['project_mappings'], (result) => {
                            const projectMappings = result.project_mappings || {};
                            projectMappings[currentProjectUrl] = jsonMappings;
                            chrome.storage.local.set({ 'project_mappings': projectMappings });
                        });
                    } else {
                        chrome.storage.local.set({ 'json_mappings': jsonMappings });
                    }
                }"""

content = content.replace(old_delete, new_delete)

with open('ide.js', 'w') as f:
    f.write(content)
