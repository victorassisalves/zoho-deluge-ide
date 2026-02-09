export const staticSuggestions = [
    { label: 'Map()', kind: 25, insertText: 'Map()' },
    { label: 'List()', kind: 25, insertText: 'List()' },
    { label: 'info', kind: 17, insertText: 'info $0', isSnippet: true },
    { label: 'if', kind: 17, insertText: 'if (${1:condition}) {\n\t$0\n}', isSnippet: true },
    { label: 'for each', kind: 17, insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', isSnippet: true }
];
