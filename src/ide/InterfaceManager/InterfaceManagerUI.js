import tabManager from '../CodeEditor/TabManager.js';
import db from '../../services/db.js';
import { bind } from '../../utils/ide-utils.js';

class InterfaceManagerUI {
    constructor() {
        this.containerId = 'interface-mappings-list';
        this.activeMappingName = null;
    }

    async init() {
        console.log('[InterfaceManagerUI] Initialized');
        window.updateInterfaceMappingsList = () => this.render();
        window.renderInterfaceTree = (name, obj) => this.renderTree(name, obj);
        this.render();
    }

    render() {
        const list = document.getElementById(this.containerId);
        const countEl = document.getElementById('mapping-count');
        if (!list) return;

        const interfaceMappings = window.interfaceMappings || {};
        const mappings = Object.keys(interfaceMappings).sort();
        if (countEl) countEl.innerText = mappings.length;

        list.innerHTML = '';
        mappings.forEach(name => {
            const item = document.createElement('div');
            item.className = 'mapping-item';
            if (this.activeMappingName === name) item.classList.add('active');

            const nameSpan = document.createElement('span');
            nameSpan.innerText = name;
            nameSpan.style.flex = '1';
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.whiteSpace = 'nowrap';

            const actions = document.createElement('div');
            actions.className = 'mapping-actions';

            actions.appendChild(this.createIcon('edit', 'Edit Mapping', (e) => {
                e.stopPropagation();
                if (window.openEditMappingModal) window.openEditMappingModal(name);
            }));

            actions.appendChild(this.createIcon('content_copy', 'Copy as Deluge Map', (e) => {
                e.stopPropagation();
                if (window.convertInterfaceToDeluge) {
                    const code = window.convertInterfaceToDeluge(name, JSON.stringify(interfaceMappings[name]));
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(code);
                        if (window.showStatus) window.showStatus('Map code copied to clipboard', 'success');
                    }
                }
            }));

            actions.appendChild(this.createIcon('data_object', 'Copy as Raw JSON', (e) => {
                e.stopPropagation();
                const json = JSON.stringify(interfaceMappings[name], null, 2);
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(json);
                    if (window.showStatus) window.showStatus('Raw JSON copied to clipboard', 'success');
                }
            }));

            actions.appendChild(this.createIcon('close', 'Delete Mapping', async (e) => {
                e.stopPropagation();
                if (confirm(`Delete mapping "${name}"?`)) {
                    delete interfaceMappings[name];
                    window.interfaceMappings = interfaceMappings;
                    if (this.activeMappingName === name) {
                        this.activeMappingName = null;
                        document.getElementById('interface-tree-view').innerHTML = '<div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px;">Select a mapping to explore its structure</div>';
                    }
                    const currentOrg = (tabManager.currentFile?.data?.orgId || 'global').toString().toLowerCase();
                    await db.delete('Interfaces', `${currentOrg}:${name}`);
                    this.render();
                }
            }, 'delete-mapping'));

            item.appendChild(nameSpan);
            item.appendChild(actions);

            item.onclick = () => {
                this.activeMappingName = name;
                document.querySelectorAll('.mapping-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.renderTree(name, interfaceMappings[name]);
            };
            list.appendChild(item);
        });
    }

    createIcon(icon, title, onClick, className = '') {
        const span = document.createElement('span');
        span.className = `material-icons ${className}`;
        span.innerHTML = icon;
        span.title = title;
        span.onclick = onClick;
        return span;
    }

    renderTree(mappingName, obj) {
        const tree = document.getElementById('interface-tree-view');
        if (!tree) return;
        tree.innerHTML = '';

        const treeHeader = document.createElement('div');
        treeHeader.className = 'tree-view-header';
        treeHeader.innerHTML = `
            <div class="tree-header-info">
                <span class="material-icons" style="font-size: 16px; color: #8be9fd;">account_tree</span>
                <span class="tree-header-title">${mappingName}</span>
            </div>
            <div class="tree-header-actions">
                <button id="tree-expand-all" title="Expand All"><span class="material-icons">unfold_more</span></button>
                <button id="tree-collapse-all" title="Collapse All"><span class="material-icons">unfold_less</span></button>
            </div>
        `;
        tree.appendChild(treeHeader);

        const treeContent = document.createElement('div');
        treeContent.className = 'tree-content';
        tree.appendChild(treeContent);

        bind('tree-expand-all', 'click', () => {
            treeContent.querySelectorAll('.tree-sub.collapsed').forEach(sub => sub.classList.remove('collapsed'));
            treeContent.querySelectorAll('.toggle-icon.collapsed').forEach(icon => icon.classList.remove('collapsed'));
            treeContent.querySelectorAll('.tree-footer').forEach(f => f.style.display = 'block');
        });

        bind('tree-collapse-all', 'click', () => {
            treeContent.querySelectorAll('.tree-sub').forEach(sub => sub.classList.add('collapsed'));
            treeContent.querySelectorAll('.toggle-icon').forEach(icon => icon.classList.add('collapsed'));
            treeContent.querySelectorAll('.tree-footer').forEach(f => f.style.display = 'none');
        });

        this.buildTree(obj, treeContent, mappingName);
    }

    buildTree(data, container, mappingName, path = "", depth = 0) {
        if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            keys.forEach(key => {
                const val = data[key];
                const isObject = typeof val === 'object' && val !== null;
                const isArray = Array.isArray(val);
                const currentPath = Array.isArray(data) ? `.get(${key})` : `.get("${key}")`;
                const fullPath = mappingName + path + currentPath;

                const node = document.createElement('div');
                node.className = 'tree-node';
                node.setAttribute('data-key', key.toLowerCase());

                const label = document.createElement('div');
                label.className = 'tree-label';

                let iconHtml = isObject ?
                    '<span class="toggle-icon material-icons" style="font-size:12px;">arrow_drop_down</span><span class="node-icon material-icons" style="font-size:12px;">folder</span>' :
                    '<span class="toggle-icon material-icons" style="visibility:hidden; font-size:12px;">arrow_drop_down</span><span class="node-icon material-icons" style="font-size:12px;">description</span>';

                const keyHtml = `<span class="tree-key">${key}</span>`;
                let valHtml = isObject ? `: ${isArray ? '[' : '{'}` : `: <span class="tree-val">${JSON.stringify(val)}</span>`;
                let typeHtml = `<span class="tree-type">${isArray ? 'List' : (isObject ? 'Map' : typeof val)}</span>`;

                label.innerHTML = `${iconHtml} ${keyHtml}${valHtml} ${typeHtml}`;

                const actions = document.createElement('div');
                actions.className = 'tree-actions';

                const copyPathBtn = document.createElement('button');
                copyPathBtn.className = 'tree-action-btn';
                copyPathBtn.innerText = 'Path';
                copyPathBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.editor) {
                        window.editor.executeEdits("tree-insert", [{ range: window.editor.getSelection(), text: fullPath }]);
                    }
                };
                actions.appendChild(copyPathBtn);

                label.appendChild(actions);
                node.appendChild(label);

                if (isObject) {
                    const sub = document.createElement('div');
                    sub.className = 'tree-sub';
                    this.buildTree(val, sub, mappingName, path + currentPath, depth + 1);
                    node.appendChild(sub);

                    label.onclick = () => {
                        const isCollapsed = sub.classList.toggle('collapsed');
                        label.querySelector('.toggle-icon').classList.toggle('collapsed', isCollapsed);
                    };
                }

                container.appendChild(node);
            });
        }
    }
}

export default InterfaceManagerUI;
