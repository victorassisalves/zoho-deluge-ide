import { h } from '../../../assets/vendor/preact.module.js';
import { useState, useEffect } from '../../../assets/vendor/hooks.module.js';
import htm from '../../../assets/vendor/htm.module.js';
import { eventBus, EVENTS } from '../../core/index.js';

const html = htm.bind(h);

export function StatusBar() {
    const [status, setStatus] = useState({ connected: false, strategy: null });

    useEffect(() => {
        const onActive = (payload) => setStatus({ connected: true, strategy: payload.strategy });
        const onLost = () => setStatus({ connected: false, strategy: null });

        const unsubActive = eventBus.on(EVENTS.CONNECTION.ACTIVE, onActive);
        const unsubLost = eventBus.on(EVENTS.CONNECTION.LOST, onLost);

        return () => {
            unsubActive();
            unsubLost();
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
