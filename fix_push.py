import sys

content = open('ide.js').read()

old_push = """                if (triggerSave) {
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) log('Success', 'Zoho Save triggered.');
                    });
                }
                if (triggerExecute) {
                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) log('Success', 'Zoho Execute triggered.');
                    });
                }"""

new_push = """                if (triggerSave) {
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) log('Success', 'Zoho Save triggered.');
                        else log('Warning', 'Zoho Save trigger returned false. Try clicking manually.');
                    });
                }
                if (triggerExecute) {
                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) log('Success', 'Zoho Execute triggered.');
                        else log('Warning', 'Zoho Execute trigger returned false. Try clicking manually.');
                    });
                }"""

if old_push in content:
    content = content.replace(old_push, new_push)
    with open('ide.js', 'w') as f:
        f.write(content)
    print("Updated pushToZoho logic")
else:
    print("Could not find old_push")
