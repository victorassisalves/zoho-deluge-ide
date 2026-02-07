import re

with open('bridge.js', 'r') as f:
    content = f.read()

# Add specific CRM Save selectors
save_part = "'#crmsave',"
save_replacement = "'#crmsave', 'lyte-button[data-zcqa=\"functionSavev2\"]', '.dxEditorPrimaryBtn',"
content = content.replace(save_part, save_replacement)

# Add specific CRM Execute selectors
exec_part = "'#crmexecute',"
exec_replacement = "'#crmexecute', 'span[data-zcqa=\"delgv2execPlay\"]', '.dx_execute_icon',"
content = content.replace(exec_part, exec_replacement)

with open('bridge.js', 'w') as f:
    f.write(content)
