import diagnostics from '../services/diagnostics.js';

export const initResizers = () => {
    diagnostics.report('UI', 'initializing resizers');
    const setup = (resizerId, panelId, prop, reverse = false) => {
        const resizer = document.getElementById(resizerId);
        const panel = document.getElementById(panelId);
        if (!resizer || !panel) return;

        let resizing = false;
        resizer.addEventListener('mousedown', () => resizing = true);
        window.addEventListener('mousemove', (e) => {
            if (!resizing) return;
            let size = prop === 'width'
                ? (reverse ? window.innerWidth - e.clientX : e.clientX)
                : window.innerHeight - e.clientY;
            if (size > 50) panel.style[prop] = size + 'px';
            window.dispatchEvent(new Event('resize'));
        });
        window.addEventListener('mouseup', () => resizing = false);
    };

    setup('left-resizer', 'sidebar-panel', 'width');
    setup('right-sidebar-resizer', 'right-sidebar', 'width', true);
    setup('bottom-resizer', 'bottom-panel', 'height');
};
