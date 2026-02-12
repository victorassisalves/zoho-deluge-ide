# Linter Module

## Purpose
Modularized syntax checking for Deluge.

## Structure
- `engine.js`: Validation orchestrator.
- `rules/`: Individual syntax check logic.

## Verification Checklist
- [ ] Unbalanced braces `{` trigger an error at the end of the file.
- [ ] Missing semicolons trigger an error on the offending line.
- [ ] Correct code does not trigger any errors.

## Golden Rules
- Each rule must be independent.
- Use `monaco.MarkerSeverity` for marker levels.
