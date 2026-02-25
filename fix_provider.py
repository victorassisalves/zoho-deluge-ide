import sys

file_path = 'app/modules/autocomplete/providers/snippet-provider.js'
with open(file_path, 'r') as f:
    content = f.read()

search_block = """        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get('my_snippets', (result) => {
                    const snippets = result.my_snippets || [];
                    const suggestions = snippets.map(s => ({
                        label: '/' + s.trigger,
                        kind: 27, // Snippet
                        detail: s.name,
                        documentation: s.comments || s.code,
                        insertText: s.code,
                        insertTextRules: 4, // InsertAsSnippet
                        range: targetRange,
                        filterText: '/' + s.trigger + ' ' + s.trigger, // Allow matching with or without slash
                        sortText: '00' + s.trigger
                    }));

                    resolve(suggestions);
                });
            } else {
                resolve([]);
            }
        });"""

replace_block = """        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get('my_snippets', (result) => {
                    const snippets = result.my_snippets || [];
                    const suggestions = [];
                    const seenSignatures = new Set();

                    snippets.forEach(s => {
                        const signature = (s.trigger || '') + '::' + (s.code || '') + '::' + (s.name || '');
                        if (seenSignatures.has(signature)) return;
                        seenSignatures.add(signature);

                        suggestions.push({
                            label: '/' + s.trigger,
                            kind: 27, // Snippet
                            detail: s.name,
                            documentation: s.comments || s.code,
                            insertText: s.code,
                            insertTextRules: 4, // InsertAsSnippet
                            range: targetRange,
                            filterText: '/' + s.trigger + ' ' + s.trigger, // Allow matching with or without slash
                            sortText: '00' + s.trigger
                        });
                    });

                    resolve(suggestions);
                });
            } else {
                resolve([]);
            }
        });"""

if search_block in content:
    content = content.replace(search_block, replace_block)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Replaced provider logic")
else:
    print("Could not find provider block")
