import { db } from '../db.js';
import { eventBus, EVENTS } from '../../core/index.js';

export class SnippetRepository {
    async getAll() {
        return await db.snippets.orderBy('createdAt').toArray();
    }

    async save(snippet) {
        // Ensure defaults
        snippet.folder = snippet.folder || 'General';
        snippet.tags = snippet.tags || [];
        snippet.updatedAt = Date.now();

        if (snippet.id) {
            await db.snippets.put(snippet);
        } else {
            snippet.createdAt = Date.now();
            await db.snippets.add(snippet);
        }

        eventBus.emit(EVENTS.SNIPPETS.SAVE, snippet);
        return snippet;
    }

    async delete(id) {
        await db.snippets.delete(id);
        eventBus.emit(EVENTS.SNIPPETS.DELETE, id);
    }
}
