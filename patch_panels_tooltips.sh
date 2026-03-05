sed -i '/#right-sidebar {/!b;n;s/overflow: hidden;/overflow: visible;/' app/styles/layout.css
sed -i '/overflow: visible;/{N;s/width: 250px;\n    background-color/overflow-x: hidden;\n    overflow-y: visible;\n    width: 250px;\n    background-color/}' app/styles/layout.css

cat << 'STYLE' >> app/styles/components/panels.css

/* Fix Tooltips for Right Sidebar Specifically */
#right-sidebar.collapsed {
    overflow: visible !important;
}

#right-sidebar.collapsed [data-tooltip]:hover::after {
    top: 50%;
    left: calc(100% + 4px);
    transform: translateY(-50%);
}

#right-sidebar [data-tooltip]:hover::after {
    /* If expanded, stay below */
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
}

#right-sidebar.collapsed .right-sidebar-header {
    height: 100%;
    border-right: 1px solid var(--md-sys-color-outline);
}

#right-sidebar.collapsed .icons-row {
    flex-direction: column !important;
    gap: var(--md-sys-spacing-4) !important;
    padding-top: var(--md-sys-spacing-4) !important;
    align-items: center;
}

STYLE
