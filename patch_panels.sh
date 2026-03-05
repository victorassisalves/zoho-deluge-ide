#!/bin/bash
sed -i '/.tree-node {/c\.tree-node {\n    margin-left: var(--md-sys-spacing-4);\n    border-left: 1px solid var(--md-sys-color-outline-variant);\n    position: relative;\n}' app/styles/components/panels.css

cat << 'STYLE' >> app/styles/components/panels.css

/* Interface Tree Actions Overrides */
.tree-label {
    display: flex;
    align-items: center;
    padding: 4px var(--md-sys-spacing-2);
    border-radius: var(--md-sys-shape-corner-small);
    transition: background 0.2s, color 0.2s;
    user-select: none;
    position: relative;
}

.tree-label:hover {
    background: var(--md-sys-color-surface-hover);
}

.tree-actions {
    display: none;
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--md-sys-color-surface-hover);
    padding-left: 8px;
    box-shadow: -8px 0 8px var(--md-sys-color-surface-hover);
    border-radius: var(--md-sys-shape-corner-small);
    align-items: center;
    gap: 4px;
}

.tree-label:hover .tree-actions {
    display: flex;
}

.tree-action-btn {
    background: transparent;
    border: 1px solid var(--md-sys-color-outline);
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    font-size: 14px;
    padding: 2px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.tree-action-btn:hover {
    color: var(--md-sys-color-primary);
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-active);
}

.tree-type {
    font-size: 10px;
    text-transform: uppercase;
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
    padding: 2px 4px;
    border-radius: 4px;
    margin-left: auto; /* Pushes to the right if possible, or before actions */
    border: 1px solid var(--md-sys-color-outline);
    font-weight: 500;
}

.tree-key {
    font-weight: 500;
}

.toggle-icon, .node-icon {
    opacity: 0.7;
    margin-right: 4px;
}
.tree-label:hover .toggle-icon, .tree-label:hover .node-icon {
    opacity: 1;
}

STYLE
