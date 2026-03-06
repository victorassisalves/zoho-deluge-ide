import re
with open("shared/protocol.js", "r") as f:
    content = f.read()
if "SCHEMA_CAPTURED" not in content:
    content = content.replace("METADATA_INTERCEPTED'", "METADATA_INTERCEPTED',\n    SCHEMA_CAPTURED: 'SCHEMA_CAPTURED'")
    with open("shared/protocol.js", "w") as f:
        f.write(content)
