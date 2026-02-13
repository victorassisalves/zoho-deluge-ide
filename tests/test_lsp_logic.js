import TypeScanner from '../src/features/type-system/TypeScanner.js';
import interfaceManager from '../src/services/InterfaceManager.js';
import { StdLib } from '../src/core/StdLib.js';

// Mock Editor
const mockEditor = {
    model: {
        getValue: () => `
// @type lead : LeadSchema
lead.put("email", "test@example.com");

// @type zoho : ZohoSystem
zoho.crm.getRecordById("Leads", 123);
        `,
        onDidChangeContent: () => {}
    },
    getModel: function() { return this.model; },
    onDidChangeModelContent: (cb) => { mockEditor.model.onDidChangeContent = cb; },
    onDidChangeModel: () => {}
};

async function testTypeScanner() {
    console.log("Testing TypeScanner...");
    const scanner = new TypeScanner();
    scanner.attach(mockEditor);

    // Initial scan should happen
    const type1 = scanner.getType("lead");
    if (type1 !== "LeadSchema") throw new Error(`Expected LeadSchema, got ${type1}`);

    const type2 = scanner.getType("zoho");
    if (type2 !== "ZohoSystem") throw new Error(`Expected ZohoSystem, got ${type2}`);

    console.log("TypeScanner Passed!");
}

async function testInterfaceManager() {
    console.log("Testing InterfaceManager...");

    // Test StdLib fallback
    const zoho = await interfaceManager.resolveInterface("zoho", "dummyFileId");
    if (!zoho) throw new Error("Failed to resolve 'zoho' from StdLib");
    if (!zoho.crm) throw new Error("Expected 'zoho' interface to have 'crm' property");

    console.log("InterfaceManager Passed!");
}

// Run tests
(async () => {
    try {
        await testTypeScanner();
        await testInterfaceManager();
        console.log("All Tests Passed!");
    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
})();
