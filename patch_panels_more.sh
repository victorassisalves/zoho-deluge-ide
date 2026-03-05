cat << 'STYLE' >> app/styles/components/panels.css

/* Fix Top Icon Tooltips */
[data-tooltip] {
    position: relative;
    z-index: 1000;
}

[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 4px); /* Fall below the element */
    left: 50%;
    transform: translateX(-50%);
    background: var(--md-sys-color-surface-active);
    color: var(--md-sys-color-on-surface-strong);
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 9999;
    pointer-events: none;
    border: 1px solid var(--md-sys-color-outline);
    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
    opacity: 0;
    animation: tooltip-fade-in 0.1s forwards;
}

/* Fix right sidebar icons container to ensure tooltips don't clip */
.icons-row {
    position: relative;
    overflow: visible;
}

/* Fix Tree View Header (Collapse/Expand buttons) */
.tree-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--md-sys-spacing-2) var(--md-sys-spacing-3);
    background: var(--md-sys-color-surface-variant);
    border-bottom: 1px solid var(--md-sys-color-outline);
    border-top: 1px solid var(--md-sys-color-outline);
    margin-bottom: var(--md-sys-spacing-2);
}

.tree-header-info {
    display: flex;
    align-items: center;
    gap: var(--md-sys-spacing-2);
}

.tree-header-title {
    font-weight: bold;
    color: var(--md-sys-color-on-surface);
}

.tree-header-actions {
    display: flex;
    gap: var(--md-sys-spacing-2);
    align-items: center;
}

.tree-header-actions button {
    background: transparent;
    border: 1px solid var(--md-sys-color-outline);
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    font-size: 16px;
    padding: 2px 4px;
    border-radius: var(--md-sys-shape-corner-extra-small);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.tree-header-actions button:hover {
    color: var(--md-sys-color-primary);
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-active);
}
STYLE
