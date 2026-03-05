import { db } from '../../services/db.js';
import { cleanupDuplicateDrafts } from './cleanup.js';

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

    async init() {
        if (!this.container) {
            console.warn(`[Explorer] Container #${this.containerId} not found.`);
            return;
        }

        // Run cleanup on init
        await cleanupDuplicateDrafts();

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

            // DEDUPLICATION & VERSIONING LOGIC
            // Group files by (Workspace + Normalized FileName)
            // We want to show ONLY the latest version of each unique file name in a workspace.
            const fileGroups = {};

            files.forEach(f => {
                const wsId = f.workspaceId || 'uncategorized';
                // Normalize filename: remove extension for grouping, then add it back for display
                // Also handle the "duplicate" issue by grouping duplicates together
                let baseName = f.fileName;
                if (baseName.endsWith('.dg')) baseName = baseName.slice(0, -3);

                const key = `${wsId}::${baseName}`;

                if (!fileGroups[key]) fileGroups[key] = [];
                fileGroups[key].push(f);
            });

            // Now, for each group, pick the LATEST one to display
            Object.values(fileGroups).forEach(group => {
                // Sort by lastSaved desc
                group.sort((a, b) => b.lastSaved - a.lastSaved);

                // The first one is the latest
                const latest = group[0];

                // Add to tree
                if (tree[latest.workspaceId]) {
                    tree[latest.workspaceId].files.push(latest);
                } else {
                    orphanFiles.push(latest);
                }

                // TODO: Store 'group' (history) somewhere if we want to show it later
                // latest._history = group.slice(1);
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

        const newStateHash = JSON.stringify({ tree, orphanFiles });
        if (this._lastStateHash === newStateHash) {
            // State hasn't changed, do not re-render DOM
            return;
        }
        this._lastStateHash = newStateHash;

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

    formatWorkspaceName(name, id) {
        if (!name) return 'Unknown Workspace';

        // Clean up "creator.zoho.com_creator" -> "Zoho Creator"
        if (name.includes('creator.zoho.com') || name.includes('_creator')) {
            return 'Zoho Creator';
        }
        if (name.includes('crm.zoho.com') || id.includes('crm')) {
            return 'Zoho CRM';
        }
        if (name.includes('books.zoho.com') || id.includes('books')) {
            return 'Zoho Books';
        }

        // Replace underscores/dashes with spaces
        return name.replace(/[_-]/g, ' ');
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

        const displayName = this.formatWorkspaceName(wsData.info.name, wsData.info.id);

        const title = document.createElement('span');
        title.className = 'workspace-title';
        title.innerText = displayName;
        title.title = wsData.info.id; // Tooltip shows full ID

        // Actions
        const actions = document.createElement('div');
        actions.className = 'workspace-actions';


        // Add File
        const addFileBtn = document.createElement('span');
        addFileBtn.className = 'material-icons action-btn';
        addFileBtn.innerText = 'note_add';
        addFileBtn.title = 'New File';
        addFileBtn.onclick = (e) => {
            e.stopPropagation();
            this.createFile(wsData.info.id);
        };
        actions.appendChild(addFileBtn);

        if (wsData.info.id !== 'uncategorized') {
            // Edit
            const editBtn = document.createElement('span');
            editBtn.className = 'material-icons action-btn';
            editBtn.innerText = 'edit';
            editBtn.title = 'Rename Workspace';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.editWorkspace(wsData.info.id, displayName);
            };
            actions.appendChild(editBtn);

            // Archive
            const archiveBtn = document.createElement('span');
            archiveBtn.className = 'material-icons action-btn';
            archiveBtn.innerText = 'archive';
            archiveBtn.title = 'Archive Workspace';
            archiveBtn.onclick = (e) => {
                e.stopPropagation();
                this.archiveWorkspace(wsData.info.id);
            };
            actions.appendChild(archiveBtn);

            // Delete
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'material-icons action-btn';
            deleteBtn.innerText = 'delete';
            deleteBtn.title = 'Delete Workspace';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteWorkspace(wsData.info.id);
            };
            actions.appendChild(deleteBtn);
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

        let displayName = file.fileName || 'Untitled';
        if (!displayName.endsWith('.dg')) displayName += '.dg';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.innerText = displayName;

        if (file.isDirty) {
            fileDiv.classList.add('is-dirty');
            const dirtyStar = document.createElement('span');
            dirtyStar.className = 'dirty-mark';
            dirtyStar.innerText = '*';
            nameSpan.appendChild(dirtyStar);
        }

        // Add Connection Icon Placeholder
        const connectionIcon = document.createElement('span');
        connectionIcon.className = 'material-icons file-connection';
        connectionIcon.innerText = 'link';
        connectionIcon.title = 'Active Tab Connected';

        // File Actions
        const actions = document.createElement('div');
        actions.className = 'file-actions';

        const linkBtn = document.createElement('span');
        linkBtn.className = 'material-icons file-action-btn';
        linkBtn.innerText = 'link';
        linkBtn.title = 'Link Active Tab to this file';
        linkBtn.onclick = (e) => {
            e.stopPropagation();
            this.linkTabToFile(file);
        };

        const renameBtn = document.createElement('span');
        renameBtn.className = 'material-icons file-action-btn';
        renameBtn.innerText = 'edit';
        renameBtn.title = 'Rename File';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            this.renameFile(file);
        };

        const moveBtn = document.createElement('span');
        moveBtn.className = 'material-icons file-action-btn';
        moveBtn.innerText = 'drive_file_move';
        moveBtn.title = 'Move File';
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            this.moveFile(file);
        };

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'material-icons file-action-btn';
        deleteBtn.innerText = 'delete';
        deleteBtn.title = 'Delete File';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteFile(file);
        };

        actions.appendChild(linkBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(moveBtn);
        actions.appendChild(deleteBtn);

        fileDiv.appendChild(icon);
        fileDiv.appendChild(nameSpan);
        fileDiv.appendChild(connectionIcon);
        fileDiv.appendChild(actions);

        fileDiv.onclick = (e) => {
            e.stopPropagation();
            this.loadFile(file);
        };

        return fileDiv;
    }

        updateFileState(fileId, updates) {
        if (!this.container) return;
        const fileEl = this.container.querySelector(`.explorer-file[data-id="${fileId}"]`);
        if (!fileEl) return; // File not in DOM, might need full refresh

        if (updates.hasOwnProperty('isDirty')) {
            if (updates.isDirty) {
                fileEl.classList.add('is-dirty');
                const nameSpan = fileEl.querySelector('.file-name');
                if (nameSpan && !nameSpan.querySelector('.dirty-mark')) {
                    const dirtyStar = document.createElement('span');
                    dirtyStar.className = 'dirty-mark';
                    dirtyStar.innerText = '*';
                    nameSpan.appendChild(dirtyStar);
                }
            } else {
                fileEl.classList.remove('is-dirty');
                const dirtyStar = fileEl.querySelector('.dirty-mark');
                if (dirtyStar) dirtyStar.remove();
            }
        }

        if (updates.hasOwnProperty('fileName') && updates.fileName) {
            let displayName = updates.fileName;
            if (!displayName.endsWith('.dg')) displayName += '.dg';
            const nameSpan = fileEl.querySelector('.file-name');
            if (nameSpan) {
                // Keep the dirty mark if it exists
                const isDirty = fileEl.classList.contains('is-dirty');
                nameSpan.innerText = displayName;
                if (isDirty) {
                    const dirtyStar = document.createElement('span');
                    dirtyStar.className = 'dirty-mark';
                    dirtyStar.innerText = '*';
                    nameSpan.appendChild(dirtyStar);
                }
            }
        }
    }

    setConnectedFile(fileId) {
        // Clear previous connected visual states
        const allFiles = this.container.querySelectorAll('.explorer-file');
        allFiles.forEach(el => el.classList.remove('is-connected'));

        // Add connected state to current target
        if (fileId) {
            const connectedEl = this.container.querySelector(`.explorer-file[data-id="${fileId}"]`);
            if (connectedEl) connectedEl.classList.add('is-connected');
        }
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

    async editWorkspace(id, currentName) {
        const newName = prompt('Enter new workspace name:', currentName);
        if (newName !== null && newName.trim() !== '') {
            await db.workspaces.update(id, { name: newName.trim() });
            this.refresh();
        }
    }

    async moveFile(file) {
        // Fetch all active workspaces to choose from
        const workspaces = await db.workspaces.where('isArchived').equals(false).toArray();
        if (workspaces.length === 0) {
            alert('No active workspaces to move to.');
            return;
        }

        let promptText = 'Move file to which workspace?\n\n';
        workspaces.forEach((ws, idx) => {
            promptText += `${idx + 1}. ${this.formatWorkspaceName(ws.name, ws.id)}\n`;
        });

        const selection = prompt(promptText + '\nEnter number:');
        const idx = parseInt(selection, 10) - 1;

        if (!isNaN(idx) && workspaces[idx]) {
            const newWsId = workspaces[idx].id;
            await db.files.update(file.id, { workspaceId: newWsId });
            this.refresh();
        }
    }

    async linkTabToFile(file) {
        if (!chrome || !chrome.runtime) return;

        // Show status?
        const event = new CustomEvent('zoho-ide:status', { detail: { msg: 'Searching for open Zoho tabs...', type: 'info' } });
        document.dispatchEvent(event);

        chrome.runtime.sendMessage({ action: 'GET_ALL_ZOHO_TABS' }, (response) => {
            if (!response || !response.tabs || response.tabs.length === 0) {
                const errEvent = new CustomEvent('zoho-ide:status', { detail: { msg: 'No open Zoho tabs found to link.', type: 'error' } });
                document.dispatchEvent(errEvent);
                return;
            }

            let promptText = `Select a Zoho tab to link to "${file.fileName}":\n\n`;
            response.tabs.forEach((tab, idx) => {
                promptText += `${idx + 1}. ${tab.title} (...${tab.url.substring(tab.url.length - 30)})\n`;
            });

            const selection = prompt(promptText + '\nEnter number:');
            if (selection === null) return;
            const idx = parseInt(selection, 10) - 1;

            if (!isNaN(idx) && response.tabs[idx]) {
                const targetTabId = response.tabs[idx].id;

                const linkingEvent = new CustomEvent('zoho-ide:status', { detail: { msg: 'Linking...', type: 'info' } });
                document.dispatchEvent(linkingEvent);

                chrome.runtime.sendMessage({ action: 'LINK_FILE_TO_TAB', fileId: file.id, tabId: targetTabId }, (linkResponse) => {
                    if (linkResponse && linkResponse.success && linkResponse.context) {
                        const successEvent = new CustomEvent('zoho-ide:status', { detail: { msg: 'Tab successfully linked!', type: 'success' } });
                        document.dispatchEvent(successEvent);
                        // Trigger context switch to focus
                        const linkEvent = new CustomEvent('zoho-ide:force-context-switch', { detail: linkResponse.context });
                        document.dispatchEvent(linkEvent);
                        this.setConnectedFile(file.id);
                    } else {
                        const errEvent = new CustomEvent('zoho-ide:status', { detail: { msg: 'Failed to link: ' + (linkResponse.error || 'Unknown Error'), type: 'error' } });
                        document.dispatchEvent(errEvent);
                    }
                });
            } else {
                const errEvent = new CustomEvent('zoho-ide:status', { detail: { msg: 'Invalid tab selection.', type: 'warning' } });
                document.dispatchEvent(errEvent);
            }
        });
    }

    async renameFile(file) {
        const newName = prompt('Enter new file name:', file.fileName);
        if (newName && newName.trim()) {
            await db.files.update(file.id, { fileName: newName.trim() });
            this.refresh();
        }
    }

    async deleteFile(file) {
        if (confirm(`Delete file "${file.fileName}" permanently?`)) {
            await db.files.delete(file.id);
            if (this.activeFileId === file.id) {
                // Tell editor to clear? For now just remove active state
                this.setActiveFile(null);
            }
            this.refresh();
        }
    }


    async createFile(workspaceId) {
        let name = prompt('Enter new file name:');
        if (!name || !name.trim()) return;
        name = name.trim();
        if (!name.endsWith('.dg')) name += '.dg';

        // Use a clean UUID string for the new file ID to avoid numeric casting issues
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const newFile = {
            id: fileId,
            workspaceId: workspaceId,
            fileName: name,
            code: '// New Zoho Deluge Script\n\n',
            variables: [],
            lastSaved: Date.now(),
            isDirty: false
        };

        await db.files.put(newFile);

        // Refresh explorer to show it
        this.refresh();

        // Auto-load it
        this.loadFile(newFile);
    }

    async createWorkspace() {
        const name = prompt('Enter new workspace name:');
        if (name && name.trim()) {
            const id = 'ws_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            await db.workspaces.put({
                id: id,
                orgId: id,
                service: 'custom',
                name: name.trim(),
                lastAccessed: Date.now(),
                isArchived: false
            });
            this.expandedWorkspaces.add(id);
            this.refresh();
        }
    }

    async deleteWorkspace(id) {
        if (confirm('Delete this workspace? All files inside will become Uncategorized.')) {
            // Uncategorize files
            const files = await db.files.where('workspaceId').equals(id).toArray();
            for (let f of files) {
                await db.files.update(f.id, { workspaceId: 'uncategorized' });
            }
            await db.workspaces.delete(id);
            this.refresh();
        }
    }
}
