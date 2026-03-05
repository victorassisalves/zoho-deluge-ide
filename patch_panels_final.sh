# Fix duplicate definitions to be clean
sed -i '/.icons-row {/c\.icons-row {\n    justify-content: flex-start;\n    gap: var(--md-sys-spacing-3);\n    padding-top: var(--md-sys-spacing-1);\n    position: relative;\n    overflow: visible;\n}' app/styles/components/panels.css
