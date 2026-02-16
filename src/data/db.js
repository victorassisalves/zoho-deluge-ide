import { Dexie } from '../../assets/vendor/dexie.js';

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
