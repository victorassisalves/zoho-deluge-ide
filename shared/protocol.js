// shared/protocol.js
// The API contract between the Zoho Deluge Extension (Host) and the IDE (Client).

export const MSG = {
    EDITOR_INIT: 'editor:init',
    CODE_EXECUTE: 'editor:execute',
    CODE_SAVE: 'editor:save',
    CODE_PULL: 'editor:pull',
    SNIPPET_INSERT: 'snippet:insert',
    CRM_FIELD_FETCH: 'crm:get_fields'
};
