import { h } from '../../../assets/vendor/preact.module.js';
import { useState, useEffect } from '../../../assets/vendor/hooks.module.js';
import htm from '../../../assets/vendor/htm.module.js';
import { SnippetRepository } from '../../data/repositories/snippet-repo.js';
import { eventBus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';
import { logger as Logger } from '../../utils/logger.js';

const html = htm.bind(h);
const snippetRepo = new SnippetRepository();

export function SnippetList() {
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSnippets = async () => {
        try {
            const list = await snippetRepo.getAll();
            setSnippets(list);
        } catch (error) {
            Logger.error('[SnippetList] Failed to load snippets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSnippets();

        // Listen for save/delete events to refresh the list
        const handleRefresh = () => loadSnippets();
        eventBus.on(EVENTS.SNIPPETS.SAVE, handleRefresh);
        eventBus.on(EVENTS.SNIPPETS.DELETE, handleRefresh);

        return () => {
            eventBus.off(EVENTS.SNIPPETS.SAVE, handleRefresh);
            eventBus.off(EVENTS.SNIPPETS.DELETE, handleRefresh);
        };
    }, []);

    const handleCreate = async () => {
        const title = prompt('Enter snippet name:', 'New Snippet');
        if (!title) return;

        try {
            await snippetRepo.save({
                title,
                code: '// Your snippet code here\ninfo "Hello World";',
                folder: 'General',
                tags: []
            });
            // Refresh handled by event listener
        } catch (err) {
            Logger.error('[SnippetList] Create failed', err);
        }
    };

    const handleInsert = (code) => {
        eventBus.emit(EVENTS.EDITOR.SET_VALUE, { code });
        eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Snippet inserted' });
    };

    return html`
        <div class="snippet-manager">
            <div class="snippet-header">
                <span class="title">Snippets</span>
                <button class="btn-new" onClick=${handleCreate}>New</button>
            </div>

            <div class="snippet-list">
                ${loading ? html`<div class="loading">Loading...</div>` : ''}

                ${!loading && snippets.length === 0 ? html`
                    <div class="empty-state">No snippets yet. Click New to create one.</div>
                ` : ''}

                ${snippets.map(s => html`
                    <div class="snippet-item" onClick=${() => handleInsert(s.code)}>
                        <div class="snippet-name">${s.title || s.name}</div>
                        <div class="snippet-meta">${s.folder}</div>
                    </div>
                `)}
            </div>

            <style>
                .snippet-manager { display: flex; flex-direction: column; height: 100%; background: #252526; color: #cccccc; font-size: 13px; }
                .snippet-header { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333; background: #2d2d2d; }
                .title { font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
                .btn-new { background: #0e639c; color: white; border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer; font-size: 11px; }
                .btn-new:hover { background: #1177bb; }
                .snippet-list { flex: 1; overflow-y: auto; padding: 0; }
                .snippet-item { padding: 8px 12px; border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; }
                .snippet-item:hover { background: #2a2d2e; }
                .snippet-name { font-weight: 500; color: #e0e0e0; margin-bottom: 2px; }
                .snippet-meta { font-size: 10px; color: #888; }
                .loading, .empty-state { padding: 20px; text-align: center; color: #888; font-style: italic; }
            </style>
        </div>
    `;
}
