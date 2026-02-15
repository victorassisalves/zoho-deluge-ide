import { h } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import { StatusBar } from './components/StatusBar.js';
import { Notification } from './components/Notification.js';

const html = htm.bind(h);

export function Layout() {
    return html`
        <div class="ide-root-container">
            <header class="ide-header">
                <div class="logo">Deluge IDE <span class="version">v1.0</span></div>
            </header>

            <main class="ide-body">
                <aside class="ide-sidebar">
                    <div class="sidebar-placeholder">Snippets</div>
                </aside>

                <section class="ide-editor-panel">
                    <div class="editor-placeholder">Select a snippet to begin coding</div>
                </section>
            </main>

            <footer class="ide-footer">
                <${StatusBar} />
            </footer>

            <${Notification} />
        </div>
    `;
}
