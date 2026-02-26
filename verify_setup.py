import os
import json

def check_file(path):
    if os.path.exists(path):
        print(f"[OK] {path} exists")
    else:
        print(f"[ERR] {path} missing")

check_file('assets/vendor/dexie.js')
check_file('app/services/db.js')
check_file('extension/host/bridge/main.js')
check_file('extension/host/bridge/products/crm.js')

with open('extension/host/content.js', 'r') as f:
    content = f.read()
    if "extension/host/bridge/main.js" in content and "type = 'module'" in content:
        print("[OK] content.js injects module bridge")
    else:
        print("[ERR] content.js injection issue")

with open('manifest.json', 'r') as f:
    manifest = json.load(f)
    resources = manifest.get('web_accessible_resources', [])[0].get('resources', [])
    if "extension/host/bridge/*" in resources:
        print("[OK] Manifest exposes bridge")
    else:
        print("[ERR] Manifest missing bridge exposure")

with open('app/core/editor-controller.js', 'r') as f:
    content = f.read()
    if "import { db }" in content and "saveToDexie" in content:
        print("[OK] editor-controller.js updated")
    else:
        print("[ERR] editor-controller.js content issue")
