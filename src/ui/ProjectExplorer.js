import fileManager from "../services/FileManager.js";
import store from "../core/store.js";
import interfaceManager from "../services/InterfaceManager.js";
import { DB } from "../core/db.js";

class ProjectExplorer {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadExplorerData();
    }

    bindEvents() {
        const header = document.getElementById("project-explorer-header");
        if (header) {
            header.addEventListener("click", () => {
                const list = document.getElementById("project-explorer-tree");
                const isCollapsed = header.classList.toggle("collapsed");
                if (list) list.style.display = isCollapsed ? "none" : "block";
            });
        }

        const historyHeader = document.getElementById("history-header");
        if (historyHeader) {
            historyHeader.addEventListener("click", () => {
                const list = document.getElementById("saved-files-list");
                const isCollapsed = historyHeader.classList.toggle("collapsed");
                if (list) list.style.display = isCollapsed ? "none" : "block";
            });
        }

        const newBtn = document.getElementById("new-btn");
        if (newBtn) {
            newBtn.addEventListener("click", () => {
                if (confirm("Start a new script?")) {
                    if (window.editor) window.editor.setValue("// New Zoho Deluge Script\n\n");
                    store.state.currentFile = null;
                    // trigger refresh
                    window.dispatchEvent(new Event("refresh-explorer"));
                }
            });
        }

        window.addEventListener("refresh-explorer", () => this.renderExplorer());
    }

    async loadExplorerData() {
        try {
            const files = await fileManager.getAllFiles();

            // Reconstruct savedFunctions tree
            store.state.savedFunctions = {};
            files.forEach(file => {
                const orgId = file.orgId || "global";
                const system = file.system || "Zoho";
                const folder = file.folder || "General";

                if (!store.state.savedFunctions[orgId]) store.state.savedFunctions[orgId] = {};
                if (!store.state.savedFunctions[orgId][system]) store.state.savedFunctions[orgId][system] = {};
                if (!store.state.savedFunctions[orgId][system][folder]) store.state.savedFunctions[orgId][system][folder] = {};

                store.state.savedFunctions[orgId][system][folder][file.id] = file;
            });

            this.renderExplorer();

        } catch (e) {
            console.error("loadExplorerData failed:", e);
        }
    }

    async safeDeleteFile(fileId, fileName) {
        try {
            // 1. Check for Orphans
            const orphans = await interfaceManager.checkOrphans(fileId);

            if (orphans.length > 0) {
                // 2. Trigger Modal
                const modal = document.getElementById('adoption-modal');
                const list = document.getElementById('orphaned-interfaces-list');
                const msg = document.getElementById('adoption-message');

                if (!modal || !list || !msg) {
                    console.error("Adoption modal elements not found in DOM");
                    return;
                }

                msg.innerHTML = `<strong>${fileName}</strong> owns <strong>${orphans.length}</strong> shared interfaces.<br>If you delete it, other files may lose autocomplete.`;

                list.innerHTML = orphans.map(i => `
                    <div class="orphan-item" style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #444;">
                        <span style="display:flex; align-items:center; gap:5px;">
                            <span class="material-icons" style="font-size:14px; color:#8be9fd;">link</span>
                            <span>${i.name}</span>
                        </span>
                        <span class="badge" style="background:#444; padding:2px 5px; border-radius:3px; font-size:10px;">${i.ownerType}</span>
                    </div>
                `).join('');

                modal.style.display = 'flex';

                // 3. Handle Actions

                const confirmBtn = document.getElementById('adoption-confirm');
                const cancelBtn = document.getElementById('adoption-cancel');
                const closeBtn = document.getElementById('adoption-modal-close');

                // OPTION A: Promote (Adopt)
                confirmBtn.onclick = async () => {
                    const file = await fileManager.getFile(fileId);
                    // Promote to the File's System (e.g., 'crm') or Org
                    const newOwnerId = file.orgId || "global";
                    const newOwnerType = "SYSTEM"; // Promoting usually goes to System level

                    await interfaceManager.promoteInterfaces(
                        orphans.map(o => o.id),
                        newOwnerId,
                        newOwnerType
                    );

                    // Now safe to delete file
                    await fileManager.deleteFile(fileId);
                    modal.style.display = 'none';
                    if (window.showStatus) window.showStatus(`Deleted file. Interfaces moved to System.`, 'success');
                    this.loadExplorerData();
                };

                // OPTION B: Delete Everything
                cancelBtn.innerText = "Delete Everything";
                cancelBtn.onclick = async () => {
                    if(confirm("Are you sure? Shared interfaces will be lost.")) {
                        // Delete the interfaces too
                        for(const o of orphans) {
                            await DB.delete('Interfaces', o.id);
                        }
                        await fileManager.deleteFile(fileId);
                        modal.style.display = 'none';
                         if (window.showStatus) window.showStatus(`Deleted file and its interfaces.`, 'info');
                        this.loadExplorerData();
                    }
                };

                // Add a "Cancel" X button logic to just close modal without deleting
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };

                return; // STOP here, wait for user input
            }

            // 4. No Orphans? Standard Delete.
            if (confirm(`Remove ${fileName} from IDE Explorer?`)) {
                await fileManager.deleteFile(fileId);
                await this.loadExplorerData();
                 if (window.showStatus) window.showStatus('File deleted.', 'success');
            }

        } catch (e) {
            console.error('[ZohoIDE] Delete failed:', e);
             if (window.showStatus) window.showStatus('Delete failed: ' + e.message, 'error');
        }
    }

    renderExplorer() {
        const treeEl = document.getElementById("project-explorer-tree");
        if (!treeEl) return;
        treeEl.innerHTML = "";

        const tree = store.state.savedFunctions;
        const orgs = Object.keys(tree);

        if (orgs.length === 0) {
            treeEl.innerHTML = "<div class='log-entry' style='font-size:11px; opacity:0.6; padding: 10px;'>No saved projects.</div>";
            return;
        }

        orgs.forEach(orgId => {
            const orgNode = this.createTreeNode(`Client: ${orgId}`, "business", "org-" + orgId);

            const orgHeader = orgNode.querySelector(".explorer-header");
            const orgDel = this.createDeleteBtn(`client "${orgId}"`, async () => {
                const files = await fileManager.getAllFiles();
                for (const file of files) {
                    if (file.orgId === orgId) await fileManager.deleteFile(file.id);
                }
                this.loadExplorerData();
            });
            orgHeader.appendChild(orgDel);

            const systems = tree[orgId];
            Object.keys(systems).forEach(system => {
                const systemNode = this.createTreeNode(system, "settings", `sys-${orgId}-${system}`);
                const sysHeader = systemNode.querySelector(".explorer-header");
                const sysDel = this.createDeleteBtn(`system "${system}"`, async () => {
                   // ... delete logic
                   this.loadExplorerData();
                });
                sysHeader.appendChild(sysDel);

                const folders = systems[system];
                Object.keys(folders).forEach(folder => {
                    const folderNode = this.createTreeNode(folder, "folder", `folder-${orgId}-${system}-${folder}`);

                    const functions = folders[folder];
                    Object.keys(functions).forEach(funcId => {
                        const func = functions[funcId];
                        const funcItem = document.createElement("div");
                        funcItem.className = "explorer-item";

                        const isActive = store.state.currentFile && store.state.currentFile.id === funcId;
                        if (isActive) funcItem.classList.add("active");

                        funcItem.style.display = "flex";
                        funcItem.style.alignItems = "center";
                        funcItem.style.justifyContent = "space-between";

                        const contentSpan = document.createElement("span");
                        contentSpan.style.display = "flex";
                        contentSpan.style.alignItems = "center";
                        contentSpan.style.flex = "1";
                        contentSpan.style.overflow = "hidden";
                        contentSpan.innerHTML = `<span class="material-icons" style="font-size:14px; color:#ce9178; margin-right:5px;">description</span>
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${func.name}</span>`;

                        const delBtn = document.createElement("span");
                        delBtn.className = "material-icons explorer-action-btn";
                        delBtn.style.fontSize = "14px";
                        delBtn.style.opacity = "0.5";
                        delBtn.style.cursor = "pointer";
                        delBtn.innerText = "close";
                        delBtn.title = "Delete File";
                        delBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.safeDeleteFile(funcId, func.name);
                        };
                        delBtn.onmouseenter = () => delBtn.style.opacity = "1";
                        delBtn.onmouseleave = () => delBtn.style.opacity = "0.5";

                        funcItem.appendChild(contentSpan);
                        funcItem.appendChild(delBtn);

                        funcItem.onclick = (e) => {
                            if (e.target === delBtn) return;
                            // Select File
                            window.dispatchEvent(new CustomEvent("file-selected", { detail: {
                                orgId, system, folder, funcId, code: func.code, metadata: func.metadata
                            }}));
                        };

                        folderNode.querySelector(".tree-sub").appendChild(funcItem);
                    });

                    systemNode.querySelector(".tree-sub").appendChild(folderNode);
                });

                orgNode.querySelector(".tree-sub").appendChild(systemNode);
            });

            treeEl.appendChild(orgNode);
        });
    }

    createTreeNode(label, icon, id) {
        const node = document.createElement("div");
        node.className = "explorer-section";

        const header = document.createElement("div");
        header.className = "explorer-header collapsed";
        header.innerHTML = `
            <span class="material-icons">expand_more</span>
            <span class="material-icons" style="font-size:14px; color:#888;">${icon}</span>
            <span style="flex: 1; margin-right: 5px;">${label}</span>
        `;

        const sub = document.createElement("div");
        sub.className = "tree-sub explorer-tree";
        sub.style.display = "none";

        header.onclick = (e) => {
            // Prevent toggling if clicking delete btn
            if (e.target.classList.contains('explorer-action-btn')) return;
            const isCollapsed = header.classList.toggle("collapsed");
            sub.style.display = isCollapsed ? "none" : "block";
        };

        node.appendChild(header);
        node.appendChild(sub);
        return node;
    }

    createDeleteBtn(desc, onDelete) {
        const deleteBtn = document.createElement("span");
        deleteBtn.className = "material-icons explorer-action-btn";
        deleteBtn.innerHTML = "close";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete ${desc}?`)) onDelete();
        };
        return deleteBtn;
    }
}

export default new ProjectExplorer();
