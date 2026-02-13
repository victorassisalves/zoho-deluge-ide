import { DB as db } from "../core/db.js";
import store from "../core/store.js";
import { StdLib } from "../core/StdLib.js";

class InterfaceManager {
    async getInterfacesForFile(fileId) {
        if (!fileId) return [];

        const file = await db.get("Files", fileId);
        if (!file) return [];

        // Scope resolution: Global > System > Folder > File
        // Fetch all interfaces
        const interfaces = await db.getAll("Interfaces");

        return interfaces.filter(i => {
            if (i.ownerType === "GLOBAL") return true;
            if (i.ownerType === "SYSTEM" && i.ownerId === file.orgId) return true; // Assuming orgId as System context for now
            if (i.ownerType === "FOLDER" && i.ownerId === file.folder) return true;
            if (i.ownerType === "FILE" && i.ownerId === file.id) return true;
            return false;
        });
    }

    async resolveInterface(name, fileId) {
        // Priority: File (0) > Folder (1) > System (2) > Global (3)
        // Lower number wins
        const priority = { "FILE": 0, "FOLDER": 1, "SYSTEM": 2, "GLOBAL": 3 };

        const candidates = await this.getInterfacesForFile(fileId);

        const match = candidates
            .filter(i => i.name === name)
            .sort((a, b) => (priority[a.ownerType] || 99) - (priority[b.ownerType] || 99))[0];

        if (match) return match.structure;

        // Fallback to Standard Library
        if (StdLib[name]) return StdLib[name];

        return null;
    }

    async saveInterface(interfaceData) {
        if (!interfaceData.id) interfaceData.id = crypto.randomUUID();
        await db.put("Interfaces", interfaceData);
    }

    async deleteInterface(id) {
        await db.delete("Interfaces", id);
    }

    async checkOrphans(fileId) {
        const interfaces = await db.getAll("Interfaces");
        // Find interfaces owned by this file that are NOT Local-only
        // We check both ownerType and sharedScope to be robust
        return interfaces.filter(i =>
            i.ownerId === fileId &&
            (i.ownerType !== "FILE" || (i.sharedScope && i.sharedScope !== "LOCAL"))
        );
    }

    async promoteInterfaces(interfaceIds, newOwnerId, newOwnerType) {
        const interfaces = await db.getAll("Interfaces");
        const updates = [];

        for (const i of interfaces) {
            if (interfaceIds.includes(i.id)) {
                // If it was Folder scoped, we might want to upgrade it, but we are setting to newOwnerType anyway.
                // We ensure sharedScope is also updated to match newOwnerType

                i.ownerId = newOwnerId;
                i.ownerType = newOwnerType;
                i.sharedScope = newOwnerType;

                updates.push(i);
            }
        }

        if (updates.length > 0) {
            for (const up of updates) await db.put("Interfaces", up);
        }
    }

    // Logic from ide.js

    tryFixJson(str) {
        if (!str) return str;
        let fixed = str.trim();

        // 0. Try to extract JSON if wrapped
        const firstBrace = fixed.indexOf("{");
        const firstBracket = fixed.indexOf("[");
        let startPos = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) startPos = firstBrace;
        else if (firstBracket !== -1) startPos = firstBracket;

        if (startPos !== -1) {
            const lastBrace = fixed.lastIndexOf("}");
            const lastBracket = fixed.lastIndexOf("]");
            let endPos = -1;
            if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) endPos = lastBrace;
            else if (lastBracket !== -1) endPos = lastBracket;

            if (endPos !== -1 && endPos > startPos) {
                fixed = fixed.substring(startPos, endPos + 1);
            }
        }

        // 1. Remove comments
        fixed = fixed.replace(/\/\/.*$/gm, "");
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, "");

        // 2. Replace single quotes with double quotes for keys
        fixed = fixed.replace(/'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'\s*:/g, "\"$1\":");

        // 3. Replace single quotes with double quotes for values
        fixed = fixed.replace(/([:\[,]\s*)'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'/g, "$1\"$2\"");

        // 4. Quote unquoted keys
        const keyPattern = /([{,]\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/g;
        fixed = fixed.replace(keyPattern, "$1\"$2\":");

        // Also handle keys at the start of a line
        fixed = fixed.replace(/^(\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/gm, "$1\"$2\":");

        // 5. Remove trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

        try {
            const obj = JSON.parse(fixed);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return fixed;
        }
    }

    convertInterfaceToDeluge(varName, jsonStr, options = {}) {
        const obj = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
        const style = options.style || "step"; // "step" or "inline"
        const isUpdate = options.update || false;
        let code = "";
        let varCounter = 0;

        if (style === "inline") {
            const toInline = (val) => {
                if (Array.isArray(val)) {
                    return "{" + val.map(item => toInline(item)).join(", ") + "}";
                } else if (typeof val === "object" && val !== null) {
                    let parts = [];
                    for (const key in val) {
                        if (key.startsWith("$")) continue;
                        parts.push(`"${key}": ${toInline(val[key])}`);
                    }
                    return "{" + parts.join(", ") + "}";
                } else {
                    if (typeof val === "string") return `"${val.replace(/"/g, "\\\"")}"`;
                    return val;
                }
            };
            return `${varName} = ${toInline(obj)};`;
        }

        // Step-by-step logic
        const processValue = (val, name) => {
            if (Array.isArray(val)) {
                const listVar = name || `list_${++varCounter}`;
                code += `${listVar} = List();\n`;
                val.forEach(item => {
                    const itemVal = processValue(item);
                    code += `${listVar}.add(${itemVal});\n`;
                });
                return listVar;
            } else if (typeof val === "object" && val !== null) {
                const mapVar = name || `map_${++varCounter}`;
                if (!isUpdate || name !== varName) {
                    code += `${mapVar} = Map();\n`;
                }
                for (const key in val) {
                        if (key.startsWith("$")) continue;
                    const memberVal = processValue(val[key]);
                    code += `${mapVar}.put("${key}", ${memberVal});\n`;
                }
                return mapVar;
            } else {
                if (typeof val === "string") return `"${val.replace(/"/g, "\\\"")}"`;
                return val;
            }
        };

        processValue(obj, varName);
        return code;
    }
}

const interfaceManager = new InterfaceManager();
export default interfaceManager;
