import { Icons } from '../icons.js';

export function renderRightPanel() {
    return `
        <div class="right-sidebar-header">
            <div class="header-row">
                <span class="header-title">Interface Manager</span>
                <span id="mapping-count" class="badge">0</span>
            </div>
            <div class="header-row icons-row">
                <button id="toggle-right-sidebar" class="sidebar-btn" title="" data-tooltip="Toggle Sidebar">
                    ${Icons.chevron_right}
                </button>
                <button id="add-interface-btn" class="sidebar-btn" title="" data-tooltip="Add Interface Mapping">
                    ${Icons.add}
                </button>
            </div>
            <div class="search-container" style="padding:0;">
                <input type="text" id="interface-search" placeholder="Search keys...">
            </div>
        </div>
        <div id="interface-mappings-list">
            <!-- Mappings will appear here -->
        </div>
        <div id="interface-tree-view">
            <div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px; padding: 20px;">
                Select a mapping to explore its structure
            </div>
        </div>
    `;
}
