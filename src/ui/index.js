import { h, render } from '../../assets/vendor/preact.module.js';
import htm from '../../assets/vendor/htm.module.js';
import { Layout } from './layout.js';
import { logger as Logger } from '../utils/logger.js';
import { eventBus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';

const html = htm.bind(h);

export const uiEngine = {
    mountPoint: null,
    shadowRoot: null,
    isVisible: false,
    mode: 'overlay', // 'overlay' | 'standalone'

    init(mode = 'overlay') {
        this.mode = mode;
        try {
            Logger.info(`[UI] Initializing IDE Shell in ${mode} mode...`);

            if (mode === 'standalone') {
                // In standalone mode (ide.html), the layout is already handled by ide.html/ide.js?
                // Wait, ide.html has a structure. If we want to replace it with V1 Layout, we mount to body.
                // But ide.html has explicit HTML structure.
                // If we are migrating to V1, we should probably respect the existing HTML for now
                // OR render V1 Layout into a specific container.

                // For now, let's assume 'standalone' means "Do not create Shadow DOM or FAB, just handle logic if needed".
                // But uiEngine.init() seems to be about MOUNTING the UI.
                // If we are in ide.html, the UI is already there (via legacy or partial V1).

                Logger.info("[UI] Standalone mode: Skipping Shadow DOM injection.");
                return;
            }

            // --- OVERLAY MODE (Injected into Zoho Page) ---

            // 1. Create a container that won't be easily affected by Zoho scripts
            this.mountPoint = document.createElement('div');
            this.mountPoint.id = 'zoho-deluge-ide-root';
            // High Z-Index on the host
            this.mountPoint.style.position = 'fixed';
            this.mountPoint.style.top = '0';
            this.mountPoint.style.right = '0';
            this.mountPoint.style.zIndex = '2147483647';
            this.mountPoint.style.pointerEvents = 'none'; // Allow clicks to pass through when hidden/transparent

            document.body.appendChild(this.mountPoint);

            // 2. Attach Shadow DOM for style isolation
            this.shadowRoot = this.mountPoint.attachShadow({ mode: 'open' });

            // 3. Inject base styles
            const style = document.createElement('style');
            style.textContent = this.getBaseStyles();
            this.shadowRoot.appendChild(style);

            // 4. Render Preact App into Shadow Root
            render(html`<${Layout} />`, this.shadowRoot);

            // 5. Setup Toggle Listener
            eventBus.on(EVENTS.UI.TOGGLE, () => this.toggle());

            // 6. Inject Floating Action Button (FAB)
            this.injectFAB();

            Logger.info("[UI] IDE Shell mounted successfully.");
        } catch (error) {
            Logger.error("[UI] Critical mount failure:", error);
        }
    },

    toggle() {
        if (this.mode === 'standalone') return; // Standalone is always visible

        this.isVisible = !this.isVisible;
        const container = this.shadowRoot.querySelector('.ide-root-container');
        if (container) {
            if (this.isVisible) {
                container.style.transform = 'translateX(0)';
                // Enable pointer events on the mount point when visible
                this.mountPoint.style.pointerEvents = 'auto';
            } else {
                container.style.transform = 'translateX(100%)';
                // Disable pointer events on the mount point when hidden to allow clicking underlying elements
                this.mountPoint.style.pointerEvents = 'none';
            }
        }
    },

    injectFAB() {
        const fab = document.createElement('div');
        fab.className = 'zoho-ide-fab';
        fab.innerHTML = '<span>IDE</span>';
        fab.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background-color: #0078d4;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 2147483646; /* Just below the IDE panel */
            font-family: sans-serif;
            font-weight: bold;
            font-size: 12px;
            user-select: none;
            transition: transform 0.2s;
        `;

        fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.1)');
        fab.addEventListener('mouseleave', () => fab.style.transform = 'scale(1)');
        fab.addEventListener('click', () => {
            eventBus.emit(EVENTS.UI.TOGGLE);
        });

        document.body.appendChild(fab);
    },

    getBaseStyles() {
        return `
            :host { --bg-dark: #1e1e1e; --accent: #0078d4; --text: #cccccc; --border: #333333; }
            .ide-root-container {
                position: fixed; right: 0; top: 0;
                width: 40vw; min-width: 600px;
                height: 100vh;
                background: var(--bg-dark); color: var(--text); border-left: 1px solid var(--border);
                display: flex; flex-direction: column;
                z-index: 999999;
                font-family: 'Segoe UI', Tahoma, sans-serif;
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
                box-shadow: -5px 0 15px rgba(0,0,0,0.5);
            }
            .ide-header { padding: 10px; border-bottom: 1px solid var(--border); font-weight: bold; display: flex; align-items: center; }
            .logo { flex: 1; }
            .version { font-size: 0.8em; opacity: 0.7; margin-left: 5px; }

            .ide-body { flex: 1; display: flex; flex-direction: row; overflow: hidden; }

            .ide-editor-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border); position: relative; }
            .editor-placeholder { color: #666; font-style: italic; }

            .ide-sidebar-right { width: 250px; background: #252526; display: flex; flex-direction: column; }

            .ide-footer { height: 25px; background: var(--accent); display: flex; align-items: center; padding: 0 10px; font-size: 11px; }
            .status-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; background: #bbb; }
            .status-online .status-indicator { background: #4ec9b0; }
            .status-offline .status-indicator { background: #f48771; }

            .ide-notification { position: absolute; bottom: 40px; left: 10px; right: 10px; padding: 10px; border-radius: 4px; font-size: 12px; animation: slideIn 0.3s ease; z-index: 1000; }
            .success { background: #2d5a27; border-left: 4px solid #4ec9b0; }
            .error { background: #5a2727; border-left: 4px solid #f48771; }
            @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
    }
};
