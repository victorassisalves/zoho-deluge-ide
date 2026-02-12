// src/ui/resizers.js
export function initResizers() {
    let isResizingRight = false;
    let isResizingLeft = false;
    let isResizingBottom = false;

    const bottomResizer = document.getElementById("bottom-resizer");
    const leftResizer = document.getElementById("left-resizer");
    const rightResizer = document.getElementById("right-sidebar-resizer");

    if (bottomResizer) {
        bottomResizer.addEventListener("mousedown", (e) => {
            isResizingBottom = true;
            document.body.style.userSelect = "none";
            document.body.classList.add("resizing");
        });
    }

    if (leftResizer) {
        leftResizer.addEventListener("mousedown", (e) => {
            isResizingLeft = true;
            document.body.style.userSelect = "none";
            document.body.classList.add("resizing");
        });
    }

    if (rightResizer) {
        rightResizer.addEventListener("mousedown", (e) => {
            isResizingRight = true;
            document.body.style.userSelect = "none";
            document.body.classList.add("resizing");
        });
    }

    window.addEventListener("mousemove", (e) => {
        if (isResizingBottom) {
            const bottomPanel = document.getElementById("bottom-panel");
            const height = window.innerHeight - e.clientY;
            if (height > 50 && height < window.innerHeight * 0.8) {
                bottomPanel.style.height = height + "px";
                document.documentElement.style.setProperty("--footer-height", height + "px");
                if (typeof chrome !== "undefined" && chrome.storage) {
                    chrome.storage.local.set({ "bottom_panel_height": height + "px" });
                }
                window.dispatchEvent(new Event("resize")); // Trigger editor layout
            }
        }
        if (isResizingRight) {
            const sidebar = document.getElementById("right-sidebar");
            if (!sidebar) return;
            const width = window.innerWidth - e.clientX;
            if (width > 50 && width < 600) {
                sidebar.classList.remove("collapsed");
                sidebar.style.width = width + "px";
                window.dispatchEvent(new Event("resize"));
            }
        } else if (isResizingLeft) {
            const leftPanel = document.getElementById("left-panel-content");
            if (!leftPanel) return;
            const sidebarWidth = document.getElementById("sidebar")?.offsetWidth || 48;
            const width = e.clientX - sidebarWidth;
            if (width > 150 && width < 600) {
                leftPanel.style.width = width + "px";
                leftPanel.style.setProperty("--left-sidebar-width", width + "px");
                window.dispatchEvent(new Event("resize"));
            }
        }
    });

    window.addEventListener("mouseup", () => {
        if (isResizingLeft) {
            const leftPanel = document.getElementById("left-panel-content");
            if (leftPanel && typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ "left_panel_width": leftPanel.style.width });
            }
        }
        if (isResizingRight) {
            const rightSidebar = document.getElementById("right-sidebar");
            if (rightSidebar && typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ "right_sidebar_width": rightSidebar.style.width });
            }
        }
        if (isResizingBottom) {
            const bottomPanel = document.getElementById("bottom-panel");
            if (bottomPanel && typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ "bottom_panel_height": bottomPanel.style.height });
            }
        }
        isResizingRight = false;
        isResizingLeft = false;
        isResizingBottom = false;
        document.body.style.userSelect = "auto";
        document.body.classList.remove("resizing");
    });
}
