import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { eventBus, EVENTS } from '../../core/index.js';

const html = htm.bind(h);

export function Notification() {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleNotify = (payload) => {
            setToast(payload);
            setTimeout(() => setToast(null), 3000);
        };

        eventBus.on(EVENTS.UI.NOTIFY, handleNotify);
        return () => eventBus.off(EVENTS.UI.NOTIFY, handleNotify);
    }, []);

    if (!toast) return null;

    return html`
        <div class="ide-notification ${toast.type}">
            <div class="notification-content">${toast.message}</div>
        </div>
    `;
}
