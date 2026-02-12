// src/services/FileManager.js
import { DB as db } from "../core/db.js";
import store from "../core/store.js";

class FileManager {
    async getFile(id) {
        return await db.get("Files", id);
    }

    async getAllFiles() {
        return await db.getAll("Files");
    }

    async getFileByTab(tab) {
        const files = await this.getAllFiles();
        return files.find(f => f.metadata && f.metadata.functionId === tab.functionId && f.metadata.orgId === tab.orgId);
    }

    async saveFile(fileData) {
        // If fileData includes code, DB wrapper handles Buffer split
        await db.put("Files", fileData);

        // Add History Snapshot
        if (db.dexie.History) {
            await db.dexie.History.add({
                fileId: fileData.id,
                timestamp: new Date(),
                content: fileData.code || "",
                trigger: "MANUAL_SAVE"
            });
        }
    }

    async deleteFile(id) {
        return await db.delete("Files", id);
    }

    // Logic from ide.js
    async saveModelsToStorage() {
        const state = store.state;
        const data = {};
        for (const key in state.models) {
            data[key] = {
                code: state.models[key].model.getValue(),
                originalCode: state.models[key].originalCode
            };

            // Also update the file in IndexedDB if it exists
            const [orgId, system, fileId] = key.split(":");
            if (fileId && fileId !== "default" && !fileId.startsWith("id_")) {
                const file = await this.getFile(fileId);
                if (file) {
                    file.code = data[key].code;
                    file.originalCode = data[key].originalCode;
                    await db.put("Files", file);
                }
            }
        }
        await db.put("Config", { key: "zide_models_data", value: data });
    }
}

const fileManager = new FileManager();
export default fileManager;
