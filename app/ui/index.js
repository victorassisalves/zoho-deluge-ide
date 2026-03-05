import { renderSidebar } from './components/sidebar.js';
import { renderLeftPanel } from './components/left-panel.js';
import { renderRightPanel } from './components/right-panel.js';
import { renderBottomPanel } from './components/bottom-panel.js';
import { renderModals } from './components/modals.js';

// Coordinator to inject UI into the shell
export function initializeUI() {
    const sidebar = document.getElementById('sidebar');
    const leftPanel = document.getElementById('left-panel-content');
    const rightSidebar = document.getElementById('right-sidebar');
    const bottomPanel = document.getElementById('bottom-panel');
    const modalsContainer = document.getElementById('modals-container');

    if (sidebar) sidebar.innerHTML = renderSidebar();
    if (leftPanel) leftPanel.innerHTML = renderLeftPanel();
    if (rightSidebar) rightSidebar.innerHTML = renderRightPanel();
    if (bottomPanel) bottomPanel.innerHTML = renderBottomPanel();
    if (modalsContainer) modalsContainer.innerHTML = renderModals();
}
