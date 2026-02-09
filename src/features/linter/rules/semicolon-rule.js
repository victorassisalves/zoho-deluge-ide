export default {
    name: 'SemicolonRule',
    validate: (context) => {
        let inCommentBlock = false;
        let openBrackets = 0;
        let openBraces = 0;
        let openParens = 0;

        const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl'];

        context.lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return;

            if (trimmed.startsWith('//')) return;
            if (trimmed.startsWith('/*')) {
                if (!trimmed.includes('*/')) inCommentBlock = true;
                return;
            }
            if (inCommentBlock) {
                if (trimmed.includes('*/')) inCommentBlock = false;
                return;
            }

            const startsWithKeyword = skipKeywords.some(kw => {
                const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                return regex.test(trimmed);
            });
            const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[');

            if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
                context.markers.push({
                    message: 'Missing semicolon',
                    severity: 8,
                    startLineNumber: i + 1,
                    startColumn: line.length + 1,
                    endLineNumber: i + 1,
                    endColumn: line.length + 2,
                    code: 'missing-semicolon'
                });
            }

            openBraces += (trimmed.match(/\{/g) || []).length;
            openBraces -= (trimmed.match(/\}/g) || []).length;
            openBrackets += (trimmed.match(/\[/g) || []).length;
            openBrackets -= (trimmed.match(/\]/g) || []).length;
            openParens += (trimmed.match(/\(/g) || []).length;
            openParens -= (trimmed.match(/\)/g) || []).length;
        });
    }
};
