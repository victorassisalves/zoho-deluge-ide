import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { eventBus, EVENTS } from '../../core/index.js';

const html = htm.bind(h);

export function StatusBar() {
    const [status, setStatus] = useState({ connected: false, strategy: null });

    useEffect(() => {
        const onActive = (payload) => setStatus({ connected: true, strategy: payload.strategy });
        const onLost = () => setStatus({ connected: false, strategy: null });

        eventBus.on(EVENTS.CONNECTION.ACTIVE, onActive);
        eventBus.on(EVENTS.CONNECTION.LOST, onLost);

        return () => {
            eventBus.off(EVENTS.CONNECTION.ACTIVE, onActive);
            eventBus.off(EVENTS.CONNECTION.LOST, onLost);
        };
    }, []);

    const statusClass = status.connected ? 'status-online' : 'status-offline';
    const statusText = status.connected
        ? `Connected: ${status.strategy}`
        : 'Searching for Editor...';

    return html`
        <div class="ide-status-bar ${statusClass}">
            <span class="status-indicator"></span>
            <span class="status-text">${statusText}</span>
        </div>
    `;
}
