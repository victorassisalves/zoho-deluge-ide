// src/services/InterfaceManager.js
import { DB as db } from "../core/db.js";
import store from "../core/store.js";

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

    async saveInterface(interfaceData) {
        if (!interfaceData.id) interfaceData.id = crypto.randomUUID();
        await db.put("Interfaces", interfaceData);
    }

    async deleteInterface(id) {
        await db.delete("Interfaces", id);
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
