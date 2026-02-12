// src/ui/SidebarManager.js
import aiAgent from "./AIAgent.js";

class SidebarManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindSidebarEvents();
        this.initResources();
        this.initDocsSearch();
    }

    bindSidebarEvents() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const leftPanel = document.getElementById('left-panel-content');
                const isActive = item.classList.contains('active');

                if (isActive && leftPanel.style.display !== 'none') {
                    leftPanel.style.display = 'none';
                    item.classList.remove('active');
                } else {
                    leftPanel.style.display = 'flex';
                    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
                    item.classList.add('active');
                    const viewId = 'view-' + item.getAttribute('data-view');
                    const view = document.getElementById(viewId);
                    if (view) view.classList.add('active');
                }
                if (window.editor) window.editor.layout();
            });
        });

        // Bottom Panel Tabs
        document.querySelectorAll('.panel-header .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-target')).classList.add('active');
            });
        });

        // Clear Console
        const clearBtn = document.getElementById('clear-console');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const out = document.getElementById('console-output');
                if(out) out.innerHTML = '';
            });
        }
    }

    initResources() {
        document.querySelectorAll('.resource-section li').forEach(li => {
            li.addEventListener('click', () => {
                const methodName = li.innerText;
                const question = `Explain the Deluge method: ${methodName} and show an example.`;
                const aiInput = document.getElementById('ai-question');
                if (aiInput) aiInput.value = question;

                // Switch to AI View
                const aiTab = document.querySelector('[data-view="ai-agent"]');
                if (aiTab) aiTab.click();

                // Trigger Ask
                aiAgent.askGemini(question);
            });
        });
    }

    initDocsSearch() {
        const searchInput = document.getElementById('docs-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const sections = document.querySelectorAll('.resource-section');
                sections.forEach(section => {
                    const items = section.querySelectorAll('li');
                    let sectionVisible = false;
                    items.forEach(item => {
                        if (item.textContent.toLowerCase().includes(term)) {
                            item.style.display = 'block';
                            sectionVisible = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    section.style.display = sectionVisible ? 'block' : 'none';
                });
            });
        }
    }
}

export default new SidebarManager();
