import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

# Update definedVars and funcParamRegex
content = content.replace(
    "const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);",
    "const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl', 'post', 'get', 'put', 'delete', 'patch']);"
)

content = content.replace(
    "const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\\s+[a-zA-Z_]\\w*\\s*\\(([^)]*)\\)/gi;",
    "const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list|collection|file)\\s+[a-zA-Z_]\\w*\\s*\\(([^)]*)\\)/gi;"
)

# Update skipKeywords and undefined variable check
search_skip = "const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl'];"
replace_skip = "const skipKeywords = ['if', 'for', 'each', 'in', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl', 'null', 'true', 'false', 'post', 'get', 'put', 'delete', 'patch'];"
content = content.replace(search_skip, replace_skip)

search_words = """                const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
                words.forEach(word => {
                    if (skipKeywords.includes(word)) return;
                    if (definedVars.has(word)) return;"""

replace_words = """                const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
                const lowerSkipKeywords = skipKeywords.map(kw => kw.toLowerCase());
                words.forEach(word => {
                    if (lowerSkipKeywords.includes(word.toLowerCase())) return;
                    if (definedVars.has(word)) return;"""

content = content.replace(search_words, replace_words)

with open('deluge-lang.js', 'w') as f:
    f.write(content)
