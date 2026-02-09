export default {
    name: 'BracketRule',
    validate: (context) => {
        let open = 0;
        context.lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//')) return;
            open += (trimmed.match(/\{/g) || []).length;
            open -= (trimmed.match(/\}/g) || []).length;
        });
        if (open !== 0) {
            context.markers.push({
                message: 'Unbalanced braces',
                severity: 8, // Error
                startLineNumber: context.lines.length,
                startColumn: 1,
                endLineNumber: context.lines.length,
                endColumn: 20
            });
        }
    }
};
