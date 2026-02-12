import tabManager from '../CodeEditor/TabManager.js';
import { getDisplayName, getRenameKey } from '../../utils/ide-utils.js';
import ideMain from '../Main.js';
import fileManager from '../../services/FileManager.js';

class Explorer {
    constructor(openEditorsContainerId, projectExplorerContainerId) {
        this.openEditorsContainerId = openEditorsContainerId;
        this.projectExplorerContainerId = projectExplorerContainerId;
    }

    async init() {
        console.log('[Explorer] Initialized');

        window.renderOpenEditors = () => this.renderOpenEditors();
        window.renderExplorer = () => this.renderProjectExplorer();

        this.renderAll();
    }

    renderAll() {
        this.renderOpenEditors();
        this.renderProjectExplorer();
    }

    renderOpenEditors() {
        const list = document.getElementById(this.openEditorsContainerId);
        if (!list) return;

        list.innerHTML = '';
        const visibleTabs = tabManager.activeTabs.filter(tab => !tabManager.ignoredTabIds.has(tab.tabId));

        if (visibleTabs.length === 0) {
            list.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6; padding: 10px;">No open functions detected.</div>';
            return;
        }

        visibleTabs.forEach((tab, index) => {
            const item = document.createElement('div');
            item.className = 'explorer-item';
            const isCurrent = tabManager.currentFile && (tabManager.currentFile.tabId === tab.tabId || (tabManager.currentFile.id === tab.functionId && tab.functionId !== 'unknown'));
            if (isCurrent) item.classList.add('active');

            const iconClass = (tab.system || 'generic').toLowerCase();
            const iconLetter = (tab.system || 'Z')[0].toUpperCase();
            const displayName = getDisplayName(tab, tabManager.renames);
            const sequenceNum = tab.tabSequence || (index + 1);

            const key = getRenameKey(tab);
            const mInfo = ideMain.editor.models[key];
            const isModified = mInfo && mInfo.model.getValue() !== mInfo.originalCode;

            let statusClass = 'active';
            let statusTitle = 'Synced with Zoho';
            if (isModified) {
                statusClass = 'modified';
                statusTitle = 'Local changes (unsaved in Zoho)';
            } else if (mInfo && mInfo.syncStatus && mInfo.syncStatus !== 'SYNCED') {
                statusClass = 'drift';
                statusTitle = `Drift: ${mInfo.syncStatus}`;
                if (mInfo.syncStatus === 'CONFLICT') statusClass = 'conflict';
            }

            item.innerHTML = `
                <span class="system-icon ${iconClass}">${iconLetter}</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${sequenceNum}) ${displayName}</span>
                <span class="status-dot ${statusClass}" title="${statusTitle}"></span>
            `;

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '4px';
            actions.style.alignItems = 'center';

            const renameBtn = document.createElement('span');
            renameBtn.className = 'material-icons';
            renameBtn.innerHTML = 'edit';
            renameBtn.style.fontSize = '12px';
            renameBtn.style.color = '#888';
            renameBtn.style.cursor = 'pointer';
            renameBtn.title = 'Rename';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.renameFunction) window.renameFunction(tab);
            };
            actions.appendChild(renameBtn);

            const closeBtn = document.createElement('span');
            closeBtn.className = 'material-icons';
            closeBtn.innerHTML = 'close';
            closeBtn.style.fontSize = '14px';
            closeBtn.style.color = '#888';
            closeBtn.style.cursor = 'pointer';
            closeBtn.title = 'Close / Stop following this tab';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                tabManager.ignoreTab(tab.tabId);
                if (tabManager.currentFile && tabManager.currentFile.tabId === tab.tabId) {
                    tabManager.currentFile = null;
                }
                this.renderOpenEditors();
            };
            actions.appendChild(closeBtn);

            item.appendChild(actions);

            item.onclick = () => {
                if (window.selectTabFile) window.selectTabFile(tab);
            };
            list.appendChild(item);
        });
    }

    renderProjectExplorer() {
        const treeEl = document.getElementById(this.projectExplorerContainerId);
        if (!treeEl) return;

        const tree = tabManager.savedFunctions;
        const orgs = Object.keys(tree).sort();

        treeEl.innerHTML = '';
        if (orgs.length === 0) {
            treeEl.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6; padding: 10px;">No saved projects.</div>';
            return;
        }

        orgs.forEach(orgId => {
            const orgNode = this.createTreeNode(`Client: ${orgId}`, 'business', 'org-' + orgId);
            let hasActiveChildInOrg = false;

            const orgHeader = orgNode.querySelector('.explorer-header');
            const orgDel = this.createDeleteBtn(`client "${orgId}"`, async () => {
                const files = await fileManager.getAllFiles();
                for (const file of files) {
                    if (file.orgId === orgId) await fileManager.deleteFile(file.id);
                }
                if (window.loadExplorerData) window.loadExplorerData();
            });
            orgHeader.appendChild(orgDel);

            const systems = tree[orgId];
            Object.keys(systems).forEach(system => {
                const systemNode = this.createTreeNode(system, 'settings', `sys-${orgId}-${system}`);
                let hasActiveChildInSys = false;
                const sysHeader = systemNode.querySelector('.explorer-header');
                const sysDel = this.createDeleteBtn(`system "${system}" in client "${orgId}"`, async () => {
                    const files = await fileManager.getAllFiles();
                    for (const file of files) {
                        if (file.orgId === orgId && file.system === system) await fileManager.deleteFile(file.id);
                    }
                    if (window.loadExplorerData) window.loadExplorerData();
                });
                sysHeader.appendChild(sysDel);

                const folders = systems[system];
                Object.keys(folders).forEach(folder => {
                    const folderNode = this.createTreeNode(folder, 'folder', `folder-${orgId}-${system}-${folder}`);
                    let hasActiveChildInFolder = false;
                    const foldHeader = folderNode.querySelector('.explorer-header');
                    const foldDel = this.createDeleteBtn(`folder "${folder}" in ${system}`, async () => {
                        const files = await fileManager.getAllFiles();
                        for (const file of files) {
                            if (file.orgId === orgId && file.system === system && file.folder === folder) {
                                await fileManager.deleteFile(file.id);
                            }
                        }
                        if (window.loadExplorerData) window.loadExplorerData();
                    });
                    foldHeader.appendChild(foldDel);

                    const functions = folders[folder];
                    Object.keys(functions).forEach(funcId => {
                        const func = functions[funcId];
                        const funcItem = document.createElement('div');
                        funcItem.className = 'explorer-item';
                        funcItem.style.paddingLeft = '30px';
                        const isActive = tabManager.currentFile && tabManager.currentFile.id === funcId && tabManager.currentFile.data.orgId === orgId;
                        if (isActive) {
                            funcItem.classList.add('active');
                            hasActiveChildInOrg = true;
                            hasActiveChildInSys = true;
                            hasActiveChildInFolder = true;
                        }

                        const isOnline = tabManager.activeTabs.some(t => t.functionId === funcId || (t.functionName === func.name && t.orgId === orgId));
                        const key = getRenameKey(func.metadata);
                        const mInfo = ideMain.editor.models[key];
                        const isModified = mInfo && mInfo.model.getValue() !== mInfo.originalCode;

                        let statusClass = isOnline ? 'active' : 'offline';
                        let statusTitle = isOnline ? 'Online' : 'Offline';
                        if (isModified) {
                            statusClass = 'modified';
                            statusTitle = 'Unsaved local changes';
                        } else if (mInfo && mInfo.syncStatus && mInfo.syncStatus !== 'SYNCED') {
                            statusClass = 'drift';
                            statusTitle = `Drift: ${mInfo.syncStatus}`;
                            if (mInfo.syncStatus === 'CONFLICT') statusClass = 'conflict';
                        }

                        const displayName = getDisplayName(func.metadata, tabManager.renames);
                        funcItem.innerHTML = `
                            <span class="material-icons" style="font-size:14px; color:#ce9178;">description</span>
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis;" class="func-name-text">${displayName}</span>
                            <span class="status-dot ${statusClass}" style="margin-right: 5px;" title="${statusTitle}"></span>
                        `;

                        const renameBtn = document.createElement('span');
                        renameBtn.className = 'material-icons';
                        renameBtn.innerHTML = 'edit';
                        renameBtn.style.fontSize = '12px';
                        renameBtn.style.color = '#888';
                        renameBtn.style.cursor = 'pointer';
                        renameBtn.style.marginRight = '5px';
                        renameBtn.onclick = (e) => { e.stopPropagation(); if (window.renameFunction) window.renameFunction(func.metadata); };
                        funcItem.appendChild(renameBtn);

                        const deleteBtn = document.createElement('span');
                        deleteBtn.className = 'material-icons';
                        deleteBtn.innerHTML = 'close';
                        deleteBtn.style.fontSize = '14px';
                        deleteBtn.style.color = '#888';
                        deleteBtn.style.cursor = 'pointer';
                        deleteBtn.onclick = async (e) => { e.stopPropagation(); if (window.safeDeleteFile) await window.safeDeleteFile(funcId, func.name); };
                        funcItem.appendChild(deleteBtn);

                        funcItem.onclick = () => { if (window.selectSavedFile) window.selectSavedFile(orgId, system, folder, funcId); };

                        if (isActive) {
                            setTimeout(() => funcItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                        }

                        folderNode.querySelector('.tree-sub').appendChild(funcItem);
                    });

                    if (hasActiveChildInFolder) {
                        folderNode.querySelector('.explorer-header').classList.remove('collapsed');
                        folderNode.querySelector('.tree-sub').style.display = 'block';
                    }
                    systemNode.querySelector('.tree-sub').appendChild(folderNode);
                });

                if (hasActiveChildInSys) {
                    systemNode.querySelector('.explorer-header').classList.remove('collapsed');
                    systemNode.querySelector('.tree-sub').style.display = 'block';
                }
                orgNode.querySelector('.tree-sub').appendChild(systemNode);
            });

            if (hasActiveChildInOrg) {
                orgNode.querySelector('.explorer-header').classList.remove('collapsed');
                orgNode.querySelector('.tree-sub').style.display = 'block';
            }
            treeEl.appendChild(orgNode);
        });
    }

    createTreeNode(label, icon, id) {
        const node = document.createElement('div');
        node.className = 'explorer-section';
        node.id = id;
        node.innerHTML = `
            <div class="explorer-header collapsed">
                <span class="material-icons">expand_more</span>
                <span class="material-icons" style="font-size:14px; color:#888;">${icon}</span>
                <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 5px;">${label}</span>
            </div>
            <div class="tree-sub explorer-tree" style="display: none;"></div>
        `;
        const header = node.querySelector('.explorer-header');
        const sub = node.querySelector('.tree-sub');
        header.onclick = () => {
            const isCollapsed = header.classList.toggle('collapsed');
            sub.style.display = isCollapsed ? 'none' : 'block';
        };
        return node;
    }

    createDeleteBtn(targetDesc, onDelete) {
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'material-icons explorer-action-btn';
        deleteBtn.innerHTML = 'close';
        deleteBtn.style.fontSize = '14px';
        deleteBtn.style.color = '#888';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.style.marginRight = '5px';
        deleteBtn.style.flexShrink = '0';
        deleteBtn.title = `Delete ${targetDesc} and all its functions`;
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete entire ${targetDesc} and all its saved functions?`)) onDelete();
        };
        return deleteBtn;
    }
}

export default Explorer;
