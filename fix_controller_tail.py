import re

with open('app/core/editor-controller.js', 'r') as f:
    content = f.read()

# Let's cleanly cut the tail off where the duplication happened.
# The duplication starts at `                    }
#                    schemaObj[formKey] = fieldsObj;`

duplication_index = content.find("                    }\n                    schemaObj[formKey] = fieldsObj;")
if duplication_index != -1:
    # Find the end of the properly formatted `});` block before the duplication.
    # We want to keep up to `    }\n});\n`
    # Let's just use string slicing.
    last_good_closure = content.rfind("});", 0, duplication_index)
    if last_good_closure != -1:
        clean_content = content[:last_good_closure + 3] + "\n"
        with open('app/core/editor-controller.js', 'w') as f:
            f.write(clean_content)
        print("Cleaned duplicate tail from editor-controller.js")
