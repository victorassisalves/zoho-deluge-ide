with open('ide.js', 'r') as f:
    content = f.read()

# Improve pullFromZoho
old_pull = """function pullFromZoho() {
    log('System', 'Pulling code...');"""

new_pull = """function pullFromZoho() {
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
        return;
    }
    log('System', 'Pulling code...');"""

if old_pull in content:
    content = content.replace(old_pull, new_pull)

# Improve pushToZoho
old_push = """function pushToZoho(triggerSave = false, triggerExecute = false) {
    const code = editor.getValue();
    log('System', 'Pushing code...');"""

new_push = """function pushToZoho(triggerSave = false, triggerExecute = false) {
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Sync/Execute failed.');
        return;
    }
    const code = editor.getValue();
    log('System', 'Pushing code...');"""

if old_push in content:
    content = content.replace(old_push, new_push)

with open('ide.js', 'w') as f:
    f.write(content)
