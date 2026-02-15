import Dexie from 'dexie';

export class DelugeIDEAppDB extends Dexie {
    constructor() {
        super('DelugeIDE');
        this.version(1).stores({
            snippets: '++id, title, code, trigger, description, *tags, folder, createdAt, updatedAt',
            settings: 'key, value',
            history: '++id, url, timestamp',
            cache: 'key, data, expiry'
        });
    }
}

export const db = new DelugeIDEAppDB();
