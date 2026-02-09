/**
 * Resizer Logic for IDE Panels
 */

export const initResizers = () => {
    const setupResizer = (resizerId, panelId, property, isReverse = false) => {
        const resizer = document.getElementById(resizerId);
        const panel = document.getElementById(panelId);
        if (!resizer || !panel) return;

        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.userSelect = 'none';
            document.body.classList.add('resizing');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            let size;
            if (property === 'width') {
                size = isReverse ? (window.innerWidth - e.clientX) : e.clientX;
                if (size > 100 && size < window.innerWidth * 0.8) {
                    panel.style.width = size + 'px';
                }
            } else {
                size = window.innerHeight - e.clientY;
                if (size > 50 && size < window.innerHeight * 0.8) {
                    panel.style.height = size + 'px';
                }
            }
            window.dispatchEvent(new Event('resize'));
        });

        window.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = 'auto';
                document.body.classList.remove('resizing');
            }
        });
    };

    setupResizer('left-resizer', 'sidebar-panel', 'width');
    setupResizer('right-sidebar-resizer', 'right-sidebar', 'width', true);
    setupResizer('bottom-resizer', 'bottom-panel', 'height');
};
