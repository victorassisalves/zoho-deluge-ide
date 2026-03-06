import shutil

# Restore from the backup again, which had the full code
shutil.copy("app/core/editor-controller.js.bak", "app/core/editor-controller.js")
print("Restored backup again")
