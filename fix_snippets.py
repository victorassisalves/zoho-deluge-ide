import os

file_path = 'my_snippets.js'
with open(file_path, 'r') as f:
    content = f.read()

# Define the loadSnippets block search string
search_load = """    function loadSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['my_snippets'], (result) => {
                mySnippets = result.my_snippets || [];
                finalizeLoad();
            });
        } else {
            // Fallback for development/testing
            try {
                const data = localStorage.getItem('my_snippets');
                mySnippets = data ? JSON.parse(data) : [];
            } catch (e) { mySnippets = []; }
            finalizeLoad();
        }
    }

    function finalizeLoad() {
        renderSnippets();
        updateCategoryDatalist();
        // Expose snippets to window so deluge-lang.js can access them
        window.mySnippets = mySnippets;
    }"""

# Define the replacement for loadSnippets
replace_load = """    function loadSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['my_snippets'], (result) => {
                mySnippets = result.my_snippets || [];
                cleanDuplicates();
                finalizeLoad();
            });
        } else {
            // Fallback for development/testing
            try {
                const data = localStorage.getItem('my_snippets');
                mySnippets = data ? JSON.parse(data) : [];
                cleanDuplicates();
            } catch (e) { mySnippets = []; }
            finalizeLoad();
        }
    }

    function cleanDuplicates() {
        const uniqueSnippets = [];
        const seenIds = new Set();
        const seenSignatures = new Set();
        let hasDuplicates = false;

        mySnippets.forEach(s => {
            const signature = (s.trigger || '') + '::' + (s.code || '') + '::' + (s.name || '');
            if (s.id && seenIds.has(s.id)) {
                hasDuplicates = true;
                return;
            }
            if (seenSignatures.has(signature)) {
                hasDuplicates = true;
                return;
            }
            if (s.id) seenIds.add(s.id);
            seenSignatures.add(signature);
            uniqueSnippets.push(s);
        });

        if (hasDuplicates) {
            mySnippets = uniqueSnippets;
            saveSnippets();
        }
    }

    function finalizeLoad() {
        renderSnippets();
        updateCategoryDatalist();
        // Expose snippets to window so deluge-lang.js can access them
        window.mySnippets = mySnippets;
    }"""

# Define the import block search string
# Note: I am copying the indentation exactly as it appears in the cat output
search_import = """                            if (confirm(`Import ${validSnippets.length} snippets? This will merge with your existing snippets.`)) {
                                validSnippets.forEach(s => {
                                    if (!s.id) s.id = Date.now() + Math.random().toString(36).substr(2, 9);
                                    mySnippets.push(s);
                                });
                                saveSnippets();
                                alert('Snippets imported successfully.');
                            }"""

# Define the replacement for import block
replace_import = """                            if (confirm(`Import ${validSnippets.length} snippets? This will merge with your existing snippets.`)) {
                                let addedCount = 0;
                                const seenSignatures = new Set(mySnippets.map(s => (s.trigger || '') + '::' + (s.code || '') + '::' + (s.name || '')));
                                const seenIds = new Set(mySnippets.map(s => s.id).filter(id => !!id));

                                validSnippets.forEach(s => {
                                    const signature = (s.trigger || '') + '::' + (s.code || '') + '::' + (s.name || '');

                                    // Skip if exact duplicate exists
                                    if (seenSignatures.has(signature)) return;
                                    if (s.id && seenIds.has(s.id)) return;

                                    if (!s.id) s.id = Date.now() + Math.random().toString(36).substr(2, 9);

                                    mySnippets.push(s);
                                    seenSignatures.add(signature);
                                    if (s.id) seenIds.add(s.id);
                                    addedCount++;
                                });

                                if (addedCount > 0) {
                                    saveSnippets();
                                    alert(`Imported ${addedCount} new snippets.`);
                                } else {
                                    alert('All snippets already exist.');
                                }
                            }"""

if search_load in content:
    content = content.replace(search_load, replace_load)
    print("Replaced loadSnippets block")
else:
    print("Could not find loadSnippets block")
    # print debug info
    # print(content.find("function loadSnippets"))

if search_import in content:
    content = content.replace(search_import, replace_import)
    print("Replaced import block")
else:
    print("Could not find import block")

with open(file_path, 'w') as f:
    f.write(content)

print("Done")
