// src/core/StdLib.js

export const StdLib = {
    zoho: {
        crm: {
            getRecordById: "Map",
            searchRecords: "List",
            createRecord: "Map",
            updateRecord: "Map",
            getRelatedRecords: "List"
        },
        creator: {
            createRecord: "Map",
            updateRecord: "Map",
            getRecordById: "Map"
        },
        books: {
            createRecord: "Map",
            getRecords: "List"
        },
        inventory: {
            createRecord: "Map",
            getRecords: "List"
        },
        sheet: {},
        writer: {},
        mail: {
            sendmail: "void"
        }
    }
};
