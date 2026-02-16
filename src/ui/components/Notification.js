import { h } from '../../../assets/vendor/preact.module.js';
import { useState, useEffect } from '../../../assets/vendor/hooks.module.js';
import htm from '../../../assets/vendor/htm.module.js';
import { eventBus, EVENTS } from '../../core/index.js';

const html = htm.bind(h);

export function Notification() {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleNotify = (payload) => {
            setToast(payload);
            setTimeout(() => setToast(null), 3000);
        };

        const unsubscribe = eventBus.on(EVENTS.UI.NOTIFY, handleNotify);
        return () => unsubscribe();
    }, []);

    if (!toast) return null;

    return html`
        <div class="ide-notification ${toast.type}">
            <div class="notification-content">${toast.message}</div>
        </div>
    `;
}
