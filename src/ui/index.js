import { h, render } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import { Layout } from './layout.js';
import { logger as Logger } from '../utils/logger.js';

const html = htm.bind(h);

export const uiEngine = {
    mountPoint: null,
    shadowRoot: null,

    init() {
        try {
            Logger.info("[UI] Initializing IDE Shell...");

            // 1. Create a container that won't be easily affected by Zoho scripts
            this.mountPoint = document.createElement('div');
            this.mountPoint.id = 'zoho-deluge-ide-root';
            document.body.appendChild(this.mountPoint);

            // 2. Attach Shadow DOM for style isolation
            this.shadowRoot = this.mountPoint.attachShadow({ mode: 'open' });

            // 3. Inject base styles (In a real build, this would be an external CSS file)
            const style = document.createElement('style');
            style.textContent = this.getBaseStyles();
            this.shadowRoot.appendChild(style);

            // 4. Render Preact App into Shadow Root
            render(html`<${Layout} />`, this.shadowRoot);

            Logger.info("[UI] IDE Shell mounted successfully.");
        } catch (error) {
            Logger.error("[UI] Critical mount failure:", error);
        }
    },

    getBaseStyles() {
        return `
            :host { --bg-dark: #1e1e1e; --accent: #0078d4; --text: #cccccc; --border: #333333; }
            .ide-root-container {
                position: fixed; right: 0; top: 0; width: 400px; height: 100vh;
                background: var(--bg-dark); color: var(--text); border-left: 1px solid var(--border);
                display: flex; flex-direction: column; z-index: 999999; font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            .ide-header { padding: 10px; border-bottom: 1px solid var(--border); font-weight: bold; }
            .ide-body { flex: 1; display: flex; overflow: hidden; }
            .ide-sidebar { width: 60px; border-right: 1px solid var(--border); background: #252526; }
            .ide-editor-panel { flex: 1; display: flex; align-items: center; justify-content: center; }
            .ide-footer { height: 25px; background: var(--accent); display: flex; align-items: center; padding: 0 10px; font-size: 11px; }
            .status-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; background: #bbb; }
            .status-online .status-indicator { background: #4ec9b0; }
            .status-offline .status-indicator { background: #f48771; }
            .ide-notification { position: absolute; bottom: 40px; left: 10px; right: 10px; padding: 10px; border-radius: 4px; font-size: 12px; animation: slideIn 0.3s ease; }
            .success { background: #2d5a27; border-left: 4px solid #4ec9b0; }
            .error { background: #5a2727; border-left: 4px solid #f48771; }
            @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
    }
};
