# Autocomplete Module (B1+B3 Hybrid)

## Purpose
Provides isolated, source-based autocomplete suggestions for Deluge.

## Structure
- `engine.js`: Monaco interaction.
- `registry.js`: Provider management.
- `providers/`: Logic for specific suggestion types.
- `data/`: Raw data (keywords, methods).

## Verification Checklist
- [ ] Dot-triggered methods show up for strings (`"test".` -> `length()`, etc).
- [ ] Native keywords (`if`, `for each`) show up in global context.
- [ ] `zoho.` triggers Zoho task suggestions.
- [ ] Variables defined in current script are suggested.
- [ ] No SyntaxErrors in console during typing.

## Golden Rules
- Never add logic to `data/*.js`.
- Always use `registry.register()` to add new providers.
