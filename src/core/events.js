export const EVENTS = {
    CORE: { INIT: 'core:init', READY: 'core:ready', ERROR: 'core:error' },
    SNIPPETS: { SAVE: 'snippets:save', DELETE: 'snippets:delete', LOADED: 'snippets:loaded' },
    CONNECTION: { ACTIVE: 'connection:active', LOST: 'connection:lost' },
    UI: { NOTIFY: 'ui:notify' },
    EDITOR: {
        SET_VALUE: 'editor:set-value',
        PULL: 'editor:pull',
        PUSH: 'editor:push'
    },
    EXECUTION: { RUN: 'execution:run' }
};
