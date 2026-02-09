export const staticSuggestions = [
    { label: 'Map()', kind: 'Constructor', insertText: 'Map()' },
    { label: 'List()', kind: 'Constructor', insertText: 'List()' },
    { label: 'Collection()', kind: 'Constructor', insertText: 'Collection()' },
    { label: 'info', kind: 'Keyword', insertText: 'info $0', isSnippet: true },
    { label: 'return', kind: 'Keyword', insertText: 'return ' },
    { label: 'if', kind: 'Keyword', insertText: 'if (${1:condition}) {\n\t$0\n}', isSnippet: true },
    { label: 'for each', kind: 'Keyword', insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', isSnippet: true },
    { label: 'try catch', kind: 'Keyword', insertText: 'try {\n\t$1\n} catch (${2:err}) {\n\t$0\n}', isSnippet: true },
    { label: 'void function', kind: 'Function', insertText: 'void ${1:name}($2) {\n\t$0\n}', isSnippet: true },
    { label: 'invokeurl', kind: 'Function', insertText: 'invokeurl\n[\n\turl: "$1"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n];', isSnippet: true },
    { label: 'sendmail', kind: 'Snippet', insertText: 'sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: "$1"\n\tsubject: "$2"\n\tmessage: "$3"\n];', isSnippet: true },
    { label: 'today', kind: 'Variable', insertText: 'today' },
    { label: 'now', kind: 'Variable', insertText: 'now' },
    { label: 'daysBetween', kind: 'Function', insertText: 'daysBetween(${1:d1}, ${2:d2})', isSnippet: true }
];
