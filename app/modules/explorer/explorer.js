import { db } from '../../services/db.js';

/**
 * File Explorer Module
 * Manages the file tree view in the sidebar using Dexie DB.
 */
export class Explorer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.activeFileId = null;
        this.expandedWorkspaces = new Set(); // Store expanded state
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn(`[Explorer] Container #${this.containerId} not found.`);
            return;
        }
        // Initial load
        this.refresh();
    }

    async refresh() {
        if (!this.container) return;

        try {
            // Save state before clearing
            this.saveState();

            // Fetch all workspaces and files
            const workspaces = await db.workspaces.toArray();
            const files = await db.files.toArray();

            // Filter out archived workspaces
            const activeWorkspaces = workspaces.filter(w => !w.isArchived);

            // Group files by workspace
            const tree = {};

            // Initialize tree with workspaces
            activeWorkspaces.forEach(ws => {
                tree[ws.id] = {
                    info: ws,
                    files: []
                };
            });

            // Distribute files
            const orphanFiles = [];
            files.forEach(f => {
                if (tree[f.workspaceId]) {
                    tree[f.workspaceId].files.push(f);
                } else {
                    if (!f.workspaceId) orphanFiles.push(f);
                }
            });

            this.render(tree, orphanFiles);

            // Restore state after rendering
            this.restoreState();

        } catch (e) {
            console.error('[Explorer] Refresh failed:', e);
            this.container.innerHTML = '<div class="log-entry error">Failed to load explorer.</div>';
        }
    }

    saveState() {
        const nodes = this.container.querySelectorAll('.explorer-workspace');
        nodes.forEach(node => {
            const wsId = node.dataset.wsId;
            if (!node.classList.contains('collapsed')) {
                this.expandedWorkspaces.add(wsId);
            } else {
                this.expandedWorkspaces.delete(wsId);
            }
        });
    }

    restoreState() {
        const nodes = this.container.querySelectorAll('.explorer-workspace');
        nodes.forEach(node => {
            const wsId = node.dataset.wsId;
            // Default to collapsed unless in expanded set
            if (this.expandedWorkspaces.has(wsId)) {
                node.classList.remove('collapsed');
                const icon = node.querySelector('.workspace-icon');
                if (icon) icon.innerText = 'folder_open';
            } else {
                node.classList.add('collapsed');
                const icon = node.querySelector('.workspace-icon');
                if (icon) icon.innerText = 'folder';
            }
        });
    }

    render(tree, orphanFiles) {
        this.container.innerHTML = '';
        const sortedWorkspaceIds = Object.keys(tree).sort((a, b) => {
            return tree[b].info.lastAccessed - tree[a].info.lastAccessed;
        });

        if (sortedWorkspaceIds.length === 0 && orphanFiles.length === 0) {
            this.container.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6;">No workspaces found. Start coding!</div>';
            return;
        }

        // Render Workspaces
        sortedWorkspaceIds.forEach(wsId => {
            const wsNode = this.createWorkspaceNode(tree[wsId]);
            this.container.appendChild(wsNode);
        });

        // Render Orphans if any
        if (orphanFiles.length > 0) {
            const orphanNode = this.createWorkspaceNode({
                info: { name: 'Uncategorized', id: 'uncategorized' },
                files: orphanFiles
            });
            this.container.appendChild(orphanNode);
        }
    }

    createWorkspaceNode(wsData) {
        const wsDiv = document.createElement('div');
        wsDiv.className = 'explorer-workspace collapsed'; // Default collapsed
        wsDiv.dataset.wsId = wsData.info.id;

        // Header
        const header = document.createElement('div');
        header.className = 'workspace-header';

        const icon = document.createElement('span');
        icon.className = 'material-icons workspace-icon';
        icon.innerText = 'folder';

        const title = document.createElement('span');
        title.className = 'workspace-title';
        title.innerText = wsData.info.name || wsData.info.service || 'Unknown';
        title.title = wsData.info.id;

        // Archive Action
        const actions = document.createElement('div');
        actions.className = 'workspace-actions';
        if (wsData.info.id !== 'uncategorized') {
            const archiveBtn = document.createElement('span');
            archiveBtn.className = 'material-icons action-btn';
            archiveBtn.innerText = 'archive';
            archiveBtn.title = 'Archive Workspace';
            archiveBtn.onclick = (e) => {
                e.stopPropagation();
                this.archiveWorkspace(wsData.info.id);
            };
            actions.appendChild(archiveBtn);
        }

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(actions);
        wsDiv.appendChild(header);

        // Files Container
        const filesContainer = document.createElement('div');
        filesContainer.className = 'workspace-files';

        // Sort files
        const sortedFiles = wsData.files.sort((a, b) => {
            if (a.isDirty && !b.isDirty) return -1;
            if (!a.isDirty && b.isDirty) return 1;
            return b.lastSaved - a.lastSaved;
        });

        if (sortedFiles.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-workspace';
            empty.innerText = 'No files';
            filesContainer.appendChild(empty);
        } else {
            sortedFiles.forEach(file => {
                const fileNode = this.createFileNode(file);
                filesContainer.appendChild(fileNode);
            });
        }

        wsDiv.appendChild(filesContainer);

        // Toggle collapse
        header.onclick = () => {
            wsDiv.classList.toggle('collapsed');
            const isCollapsed = wsDiv.classList.contains('collapsed');
            icon.innerText = isCollapsed ? 'folder' : 'folder_open';

            // Update state immediately
            if (isCollapsed) this.expandedWorkspaces.delete(wsData.info.id);
            else this.expandedWorkspaces.add(wsData.info.id);
        };

        return wsDiv;
    }

    createFileNode(file) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'explorer-file';
        fileDiv.dataset.id = file.id;

        if (this.activeFileId === file.id) {
            fileDiv.classList.add('active-file');
        }

        const icon = document.createElement('span');
        icon.className = 'material-icons file-icon';
        icon.innerText = 'description';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.innerText = file.fileName || 'Untitled';

        if (file.isDirty) {
            fileDiv.classList.add('is-dirty');
            const dirtyStar = document.createElement('span');
            dirtyStar.className = 'dirty-mark';
            dirtyStar.innerText = '*';
            nameSpan.appendChild(dirtyStar);
        }

        fileDiv.appendChild(icon);
        fileDiv.appendChild(nameSpan);

        fileDiv.onclick = (e) => {
            e.stopPropagation();
            this.loadFile(file);
        };

        return fileDiv;
    }

    async loadFile(file) {
        this.setActiveFile(file.id);
        const event = new CustomEvent('explorer:load-file', { detail: file });
        document.dispatchEvent(event);
    }

    setActiveFile(fileId) {
        this.activeFileId = fileId;
        const allFiles = this.container.querySelectorAll('.explorer-file');
        allFiles.forEach(el => el.classList.remove('active-file'));

        const activeEl = this.container.querySelector(`.explorer-file[data-id="${fileId}"]`);
        if (activeEl) activeEl.classList.add('active-file');
    }

    async archiveWorkspace(id) {
        if (confirm('Archive this workspace? It will be hidden from the explorer.')) {
            await db.workspaces.update(id, { isArchived: true });
            this.refresh();
        }
    }
}
