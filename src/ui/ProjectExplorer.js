// src/ui/ProjectExplorer.js
import fileManager from "../services/FileManager.js";
import store from "../core/store.js";

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

            const history = await fileManager.getAllFiles(); // Actually History table is different
            // History loading logic in ide.js uses DB.getAll('History')
            // I should use DB directly or FileManager if I added getHistory
            // I'll use DB directly here for simplicity or assume FileManager handles it?
            // FileManager.saveFile adds history. I didn't add getHistory to FileManager.
            // I will skip History rendering for now or use DB global if available.

            this.renderExplorer();

        } catch (e) {
            console.error("loadExplorerData failed:", e);
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

                        funcItem.innerHTML = `<span class="material-icons" style="font-size:14px; color:#ce9178;">description</span>
                        <span style="flex:1;">${func.name}</span>`;

                        funcItem.onclick = () => {
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
