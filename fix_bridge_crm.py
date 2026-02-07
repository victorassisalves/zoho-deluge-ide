import re

with open('bridge.js', 'r') as f:
    content = f.read()

# Update triggerZohoAction selectors
save_selectors = """[
                'button[id="save_script"]',
                'button[id="save_btn"]',
                '#save_script',
                '#save_btn',
                '#crmsave',
                '.crm-save-btn',
                '.zc-save-btn',
                '.save-btn',
                '.lyte-button[data-id="save"]',
                '.lyte-button[data-id="update"]',
                '.lyte-button[data-id="save_and_close"]',
                '.save_btn',
                'input#saveBtn',
                'input[value="Save"]'
            ]"""

execute_selectors = """[
                'button[id="execute_script"]',
                'button[id="run_script"]',
                '#execute_script',
                '#run_script',
                '#crmexecute',
                '#runscript',
                '.zc-execute-btn',
                '.execute-btn',
                '.lyte-button[data-id="execute"]',
                '.lyte-button[data-id="run"]',
                '.lyte-button[data-id="save_and_execute"]',
                '.execute_btn',
                '#execute_btn',
                'input#executeBtn',
                'input[value="Execute"]',
                'input[value="Run"]'
            ]"""

content = re.sub(r"selectors = \[\s+'button\[id=\"save_script\"\]',.*?\];", f"selectors = {save_selectors};", content, flags=re.DOTALL)
content = re.sub(r"selectors = \[\s+'button\[id=\"execute_script\"\]',.*?\];", f"selectors = {execute_selectors};", content, flags=re.DOTALL)

# Update text-based fallback
text_fallback_save = """if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close') || txt.includes('save and close')) {"""
content = content.replace("if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script')) {", text_fallback_save)

text_fallback_execute = """if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script') || txt.includes('save & execute') || txt.includes('save and execute')) {"""
content = content.replace("if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {", text_fallback_execute)

with open('bridge.js', 'w') as f:
    f.write(content)
