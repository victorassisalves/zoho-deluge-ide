// src/services/InterfaceManager.js
import { DB as db } from "../core/db.js";
import store from "../core/store.js";
import { typeMethods } from "../core/StdLib.js";

class InterfaceManager {
    async getInterfacesForFile(fileId) {
        if (!fileId) return [];

        const file = await db.get("Files", fileId);

        const orgId = file ? file.orgId : null;
        const folderId = file ? file.folder : null;
        const fileIdReal = file ? file.id : null;

        // Scope resolution: Global > System > Folder > File
        const interfaces = await db.getAll("Interfaces");

        return interfaces.filter(i => {
            if (i.ownerType === "GLOBAL") return true;
            if (i.ownerType === "SYSTEM" && i.ownerId === orgId) return true;
            if (i.ownerType === "FOLDER" && i.ownerId === folderId) return true;
            if (i.ownerType === "FILE" && i.ownerId === fileIdReal) return true;
            return false;
        });
    }

    async resolveInterface(name, fileId) {
        // 1. Check Standard Library
        if (typeMethods[name]) {
            return { type: 'standard', data: typeMethods[name] };
        }

        // 2. Check DB
        const interfaces = await this.getInterfacesForFile(fileId);
        const candidates = interfaces.filter(i => i.name === name);

        if (candidates.length === 0) return null;

        // Sort by scope specificity: File > Folder > System > Global
        const priorities = { 'FILE': 4, 'FOLDER': 3, 'SYSTEM': 2, 'GLOBAL': 1 };
        candidates.sort((a, b) => (priorities[b.ownerType] || 0) - (priorities[a.ownerType] || 0));

        const bestMatch = candidates[0];
        try {
             const json = typeof bestMatch.structure === 'string' ? JSON.parse(bestMatch.structure) : bestMatch.structure;
             return { type: 'json', data: json };
        } catch (e) {
             console.error("Failed to parse interface JSON", e);
             return null;
        }
    }

    async saveInterface(interfaceData) {
        if (!interfaceData.id) interfaceData.id = crypto.randomUUID();
        await db.put("Interfaces", interfaceData);
    }

    async deleteInterface(id) {
        await db.delete("Interfaces", id);
    }

    tryFixJson(str) {
        if (!str) return str;
        let fixed = str.trim();

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

        fixed = fixed.replace(/\/\/.*$/gm, "");
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, "");
        fixed = fixed.replace(/'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'\s*:/g, "\"$1\":");
        fixed = fixed.replace(/([:\[,]\s*)'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'/g, "$1\"$2\"");
        const keyPattern = /([{,]\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/g;
        fixed = fixed.replace(keyPattern, "$1\"$2\":");
        fixed = fixed.replace(/^(\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/gm, "$1\"$2\":");
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
