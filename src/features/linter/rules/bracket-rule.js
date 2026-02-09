export default {
    name: 'BracketBalanceRule',
    validate: (context) => {
        let openBraces = 0;
        let openBrackets = 0;
        let openParens = 0;
        let inCommentBlock = false;

        context.lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//')) return;
            if (trimmed.startsWith('/*')) {
                if (!trimmed.includes('*/')) inCommentBlock = true;
                return;
            }
            if (inCommentBlock) {
                if (trimmed.includes('*/')) inCommentBlock = false;
                return;
            }

            openBraces += (trimmed.match(/\{/g) || []).length;
            openBraces -= (trimmed.match(/\}/g) || []).length;
            openBrackets += (trimmed.match(/\[/g) || []).length;
            openBrackets -= (trimmed.match(/\]/g) || []).length;
            openParens += (trimmed.match(/\(/g) || []).length;
            openParens -= (trimmed.match(/\)/g) || []).length;
        });

        if (openBraces !== 0) {
            context.markers.push({
                message: `Unbalanced braces: ${openBraces > 0 ? 'Missing closing }' : 'Extra closing }'}`,
                severity: 8, // Error
                startLineNumber: context.lines.length,
                startColumn: 1,
                endLineNumber: context.lines.length,
                endColumn: context.lines[context.lines.length - 1].length + 1
            });
        }
    }
};
