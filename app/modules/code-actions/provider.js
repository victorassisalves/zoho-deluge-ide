export function registerCodeActionProvider(monaco) {
    monaco.languages.registerCodeActionProvider('deluge', {
        provideCodeActions: (model, range, context, token) => {
            const actions = context.markers
                .filter(m => m.code === 'missing-semicolon')
                .map(m => ({
                    title: "Add missing semicolon",
                    diagnostics: [m],
                    kind: "quickfix",
                    edit: {
                        edits: [{
                            resource: model.uri,
                            textEdit: {
                                range: new monaco.Range(m.startLineNumber, m.startColumn, m.startLineNumber, m.startColumn),
                                text: ";"
                            }
                        }]
                    },
                    isPreferred: true
                }));
            return { actions, dispose: () => {} };
        }
    });
}
