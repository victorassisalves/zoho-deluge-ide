/**
 * Left Sidebar Logic
 */

export const initLeftSidebar = () => {
    const sidebarIcons = document.querySelectorAll('.sidebar-icon');
    const sidebarPanel = document.getElementById('sidebar-panel');
    const viewContents = document.querySelectorAll('.view-content');

    sidebarIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetView = icon.getAttribute('data-view');

            if (icon.classList.contains('active')) {
                // Toggle off
                icon.classList.remove('active');
                sidebarPanel.classList.add('collapsed');
            } else {
                // Toggle on or switch
                sidebarIcons.forEach(i => i.classList.remove('active'));
                viewContents.forEach(v => v.classList.remove('active'));

                icon.classList.add('active');
                sidebarPanel.classList.remove('collapsed');
                const view = document.getElementById('view-' + targetView);
                if (view) view.classList.add('active');
            }

            // Trigger editor layout
            window.dispatchEvent(new Event('resize'));
        });
    });
};
