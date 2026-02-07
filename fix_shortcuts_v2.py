import re

with open('ide.js', 'r') as f:
    content = f.read()

# Update global keydown listener
old_listener = r"""window\.addEventListener\("keydown", \(e\) => \{
            const isMac = navigator\.platform\.toUpperCase\(\)\.indexOf\("MAC"\) >= 0;
            const ctrlCmd = isMac \? e\.metaKey : e\.ctrlKey;
            if \(ctrlCmd && e\.shiftKey\) \{
                const key = e\.key\.toLowerCase\(\);
                if \(key === "s"\) \{
                    e\.preventDefault\(\);
                    pushToZoho\(true\);
                \} else if \(e\.code === "Enter" \|\| e\.key === "Enter"\) \{
                    e\.preventDefault\(\);
                    pushToZoho\(true, true\);
                \} else if \(key === "p"\) \{
                    e\.preventDefault\(\);
                    pullFromZoho\(\);
                \}
            \}
        \}, true\);"""

new_listener = """window.addEventListener("keydown", (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const ctrlCmd = isMac ? e.metaKey : e.ctrlKey;
            if (ctrlCmd && e.shiftKey) {
                const code = e.code;
                if (code === "KeyS") {
                    e.preventDefault();
                    e.stopPropagation();
                    pushToZoho(true);
                } else if (code === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    pushToZoho(true, true);
                } else if (code === "KeyP") {
                    e.preventDefault();
                    e.stopPropagation();
                    pullFromZoho();
                }
            }
        }, true);"""

content = re.sub(old_listener, new_listener, content)

with open('ide.js', 'w') as f:
    f.write(content)
