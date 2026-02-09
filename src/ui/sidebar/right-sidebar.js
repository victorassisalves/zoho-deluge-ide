/**
 * Right Sidebar Logic
 */

export const initRightSidebar = () => {
    const toggleBtn = document.getElementById('toggle-right-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');

    if (toggleBtn && rightSidebar) {
        toggleBtn.addEventListener('click', () => {
            rightSidebar.classList.toggle('collapsed');
            window.dispatchEvent(new Event('resize'));
        });
    }
};
