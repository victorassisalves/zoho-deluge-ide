export const EVENTS = {
    // System Lifecycle
    CORE: {
        INIT: 'core:init',
        READY: 'core:ready',
        ERROR: 'core:error'
    },

    // The "Live-Link" (Connection Sentinel)
    CONNECTION: {
        ACTIVE: 'connection:active', // Editor found
        LOST: 'connection:lost',     // Editor removed
        RETRY: 'connection:retry'    // Manual retry trigger
    },

    // Editor Interaction (Monaco)
    EDITOR: {
        MOUNTED: 'editor:mounted',   // Monaco is ready
        CHANGE: 'editor:change',     // Text changed (debounced)
        FORMAT: 'editor:format',     // User clicked "Format"
        SET_VALUE: 'editor:set-value' // Programmatic update
    },

    // Execution & Sync (The Bridge)
    EXECUTION: {
        PULL: 'execution:pull',       // User clicked "Pull"
        PUSH: 'execution:push',       // User clicked "Push"
        RUN: 'execution:run',         // User clicked "Run"
        SUCCESS: 'execution:success', // Zoho said "Code Executed Successfully"
        FAILURE: 'execution:failure'  // Zoho returned an error trace
    },

    // UI & Shell
    UI: {
        THEME_TOGGLE: 'ui:theme-toggle',
        PANEL_TOGGLE: 'ui:panel-toggle', // e.g., Open "Snippets" panel
        NOTIFY: 'ui:notify'              // Show toast message
    },

    // Features
    LINTER: {
        RUN: 'linter:run',
        RESULTS: 'linter:results'     // Send errors to Diagnostics panel
    },
    SNIPPETS: {
        SAVE: 'snippets:save',
        INSERT: 'snippets:insert',    // Insert code at cursor
        DELETE: 'snippets:delete'
    }
};
