cat << 'STYLE' >> app/styles/components/panels.css

/* Explicitly fix collapsed tooltips to shoot right */
#right-sidebar.collapsed [data-tooltip]:hover::after {
    top: 50% !important;
    left: calc(100% + 8px) !important;
    transform: translateY(-50%) !important;
    white-space: nowrap !important;
}

/* Explicitly fix expanded tooltips to shoot down */
#right-sidebar:not(.collapsed) [data-tooltip]:hover::after {
    top: calc(100% + 8px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    white-space: nowrap !important;
}

/* Ensure container allows overflow */
.right-sidebar-header, .icons-row {
    overflow: visible !important;
}

/* Fix vanishing + button */
#right-sidebar.collapsed .right-sidebar-header {
    height: 100vh; /* Give it enough space so flex children don't squish or hide */
    justify-content: flex-start;
}

#right-sidebar.collapsed .icons-row {
    flex-direction: column !important;
    gap: var(--md-sys-spacing-4) !important;
    padding-top: var(--md-sys-spacing-4) !important;
    display: flex !important;
}

#right-sidebar.collapsed #add-interface-btn {
    display: flex !important;
}

STYLE
