# Linter Feature

## Purpose
Real-time syntax validation for Deluge code.

## Structure
- \`engine.js\`: Orchestrates the validation process and interfaces with Monaco.
- \`rules/\`: Individual validation rules. Each rule must export an object with a \`validate(context)\` method.

## API
- \`initLinter(monaco)\`: Initializes the linter.
- \`engine.registerRule(rule)\`: Add a custom validation rule.

## Golden Rules
1. **Rule Isolation**: Rules must be independent.
2. **Performance**: Linter runs on every keystroke. Keep regex efficient.
3. **No False Positives**: If a syntax is valid Deluge, the linter must not mark it as an error.
