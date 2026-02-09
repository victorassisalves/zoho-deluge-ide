/**
 * Dracula Theme for Monaco
 */

export const registerDraculaTheme = (monaco) => {
    monaco.editor.defineTheme('dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6272a4' },
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'delimiter', foreground: 'f8f8f2' },
            { token: 'operator', foreground: 'ff79c6' },
            { token: 'identifier', foreground: 'f8f8f2' },
            { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
            { token: 'function', foreground: '50fa7b' },
            { token: 'method', foreground: '50fa7b' },
            { token: 'variable', foreground: 'ffb86c' },
            { token: 'key', foreground: '8be9fd' },
            { token: 'brackets', foreground: 'f8f8f2' }
        ],
        colors: {
            'editor.background': '#282a36',
            'editor.foreground': '#f8f8f2',
            'editorCursor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#44475a',
            'editorLineNumber.foreground': '#6272a4',
            'editor.selectionBackground': '#44475a',
            'editorIndentGuide.background': '#44475a',
            'editorIndentGuide.activeBackground': '#6272a4'
        }
    });
};
