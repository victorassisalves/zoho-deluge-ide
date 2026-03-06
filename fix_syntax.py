with open("app/core/editor-controller.js", "r") as f:
    content = f.read()

# Instead of patching, I will just copy the backup that had the valid syntax, then carefully apply the logic inside a new script that doesn't use regex.
import shutil
shutil.copy("app/core/editor-controller.js.bak", "app/core/editor-controller.js")
print("Restored backup")
