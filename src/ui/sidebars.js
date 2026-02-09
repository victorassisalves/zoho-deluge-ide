export const initSidebars = () => {
    const leftIcons = document.querySelectorAll('.sidebar-icon');
    leftIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-icon').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
            icon.classList.add('active');
            const view = document.getElementById('view-' + icon.getAttribute('data-view'));
            if (view) view.classList.add('active');
            document.getElementById('sidebar-panel').classList.remove('collapsed');
            window.dispatchEvent(new Event('resize'));
        });
    });

    // Redundant with ide.js - keeping consolidated there for now
    /*
    const rightToggle = document.getElementById('toggle-right-sidebar');
    if (rightToggle) {
        rightToggle.addEventListener('click', () => {
            document.getElementById('right-sidebar').classList.toggle('collapsed');
            window.dispatchEvent(new Event('resize'));
        });
    }
    */
};
