# Zoho Deluge Advanced IDE - Modular Architecture

## Overview
The application is structured into modular components using ES Modules.
This prevents regressions by isolating features and data.

## Directory Structure
- \`src/core/\`: Monaco Editor lifecycle.
- \`src/features/\`: Independent app features (Autocomplete, Linter).
- \`src/ui/\`: Modular UI components.
- \`src/services/\`: State management and external APIs.
- \`src/bridge/\`: Logic running inside Zoho tabs.
- \`src/utils/\`: Shared helpers.

## Golden Rules for Development
1. **Never use window globals**. Use \`src/services/store.js\`.
2. **Follow Module Boundaries**. Do not reach into a feature's internal folders unless through its index.js.
3. **Update Documentation**. If you change an API, update the corresponding \`AGENTS.md\`.
4. **Bump Version**. Always update \`manifest.json\` version after significant changes.

## Testing
Run tests using \`npm test\` (Jest).
