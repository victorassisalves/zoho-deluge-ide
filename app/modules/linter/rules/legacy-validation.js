import { extractVariables } from '../../analysis.js';

export default {
    validate: (context) => {
        const { code, lines, markers } = context;
        if (!code) return;

        let openBraces = 0;
        let openBrackets = 0;
        let openParens = 0;
        let inCommentBlock = false;

        // 1. Collect defined variables
        const varMap = extractVariables(code);

        const mandatoryParams = {
            'zoho.crm.getRecordById': 2,
            'zoho.crm.createRecord': 2,
            'zoho.crm.updateRecord': 3,
            'zoho.crm.searchRecords': 2,
            'zoho.books.getRecords': 2,
            'zoho.books.createRecord': 3,
            'zoho.recruit.getRecordById': 2,
            'zoho.creator.getRecords': 4,
            'zoho.creator.createRecord': 4
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return;

            // Comment handling
            if (trimmed.startsWith('//')) return;
            if (trimmed.startsWith('/*')) {
                if (!trimmed.includes('*/')) inCommentBlock = true;
                return;
            }
            if (inCommentBlock) {
                if (trimmed.includes('*/')) inCommentBlock = false;
                return;
            }

            // Count brackets for current line and global balance
            openBraces += (trimmed.match(/\{/g) || []).length;
            openBraces -= (trimmed.match(/\}/g) || []).length;
            openBrackets += (trimmed.match(/\[/g) || []).length;
            openBrackets -= (trimmed.match(/\]/g) || []).length;
            openParens += (trimmed.match(/\(/g) || []).length;
            openParens -= (trimmed.match(/\)/g) || []).length;

            const skipKeywords = ['if', 'for', 'each', 'in', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'true', 'false', 'null'];
            const startsWithKeyword = skipKeywords.some(kw => {
                const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                return regex.test(trimmed);
            });
            const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[') || trimmed.toLowerCase().endsWith('invokeurl') || trimmed.toLowerCase().endsWith('sendmail');

            // Semicolon check
            if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
                markers.push({
                    message: 'Missing semicolon',
                    severity: 8, // Error
                    startLineNumber: i + 1, startColumn: line.length + 1,
                    endLineNumber: i + 1, endColumn: line.length + 2,
                    code: 'missing-semicolon'
                });
            }

            // Undefined variable check (Simple heuristic)
            // Use a regex that respects word boundaries and ignores matches inside strings
            const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_\-]*\b/g;
            let wordMatch;
            while ((wordMatch = wordRegex.exec(line)) !== null) {
                const word = wordMatch[0];
                const index = wordMatch.index;

                if (skipKeywords.includes(word)) continue;
                if (varMap[word]) continue;

                // Check if it's part of a string
                const before = line.substring(0, index);
                const after = line.substring(index + word.length);
                if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) continue;
                if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) continue;

                // Check if it's followed by ( or . (might be a function/namespace) or : (a key)
                const restOfLine = after.trim();
                if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) continue;

                // If it's on the left of =, it's being defined now
                if (restOfLine.startsWith('=')) continue;

                // If it's part of a mapping name, it's valid
                if (window.interfaceMappings && window.interfaceMappings[word]) continue;

                markers.push({
                    message: `Undefined variable: '${word}'`,
                    severity: 4, // Warning
                    startLineNumber: i + 1, startColumn: index + 1,
                    endLineNumber: i + 1, endColumn: index + word.length + 1
                });
            }

            // Mandatory Parameter Check
            for (const [fn, count] of Object.entries(mandatoryParams)) {
                if (trimmed.includes(fn)) {
                    const fnIndex = line.indexOf(fn);
                    const rest = line.substring(fnIndex + fn.length).trim();
                    if (rest.startsWith('(')) {
                        // Count commas inside the parens (very naive)
                        let parenLevel = 0;
                        let commas = 0;
                        let inParens = false;
                        for (let j = 0; j < rest.length; j++) {
                            if (rest[j] === '(') { parenLevel++; inParens = true; }
                            else if (rest[j] === ')') {
                                parenLevel--;
                                if (parenLevel === 0) break;
                            }
                            else if (rest[j] === ',' && parenLevel === 1) commas++;
                        }
                        const paramCount = commas === 0 && inParens && rest.indexOf(')') > rest.indexOf('(') + 1 ? 1 : (commas + 1);
                        // Correct for empty parens
                        const emptyParens = rest.match(/\(\s*\)/);
                        const actualCount = emptyParens && emptyParens.index === 0 ? 0 : (inParens ? paramCount : 0);

                        if (actualCount < count) {
                            markers.push({
                                message: `${fn} requires at least ${count} parameters. Found ${actualCount}.`,
                                severity: 8, // Error
                                startLineNumber: i + 1, startColumn: fnIndex + 1,
                                endLineNumber: i + 1, endColumn: fnIndex + fn.length + 1
                            });
                        }
                    }
                }
            }
        });

        if (openBraces !== 0) {
            markers.push({
                message: `Unbalanced braces: ${openBraces > 0 ? 'Missing closing }' : 'Extra closing }'}`,
                severity: 8, // Error
                startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
            });
        }
    }
};
