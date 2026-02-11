/**
 * src/utils/VirtualList.js
 * A simple vanilla JS virtual list to handle large datasets efficiently.
 */

window.VirtualList = class VirtualList {
    constructor(container, options) {
        this.container = container;
        this.itemHeight = options.itemHeight || 40;
        this.renderItem = options.renderItem;
        this.items = options.items || [];
        this.buffer = options.buffer || 5;

        this.scroller = document.createElement('div');
        this.scroller.style.height = (this.items.length * this.itemHeight) + 'px';
        this.scroller.style.position = 'relative';
        this.scroller.style.overflow = 'hidden';

        this.container.innerHTML = '';
        this.container.appendChild(this.scroller);
        this.container.style.overflowY = 'auto';

        this.visibleItems = new Map(); // id -> element

        this.container.onscroll = () => this.render();
        this.render();
    }

    updateItems(newItems) {
        this.items = newItems;
        this.scroller.style.height = (this.items.length * this.itemHeight) + 'px';
        this.render();
    }

    render() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;

        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
        const endIndex = Math.min(this.items.length - 1, Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer);

        const keepIndices = new Set();

        for (let i = startIndex; i <= endIndex; i++) {
            keepIndices.add(i);
            if (!this.visibleItems.has(i)) {
                const item = this.items[i];
                const el = this.renderItem(item, i);
                el.style.position = 'absolute';
                el.style.top = (i * this.itemHeight) + 'px';
                el.style.width = '100%';
                el.style.height = this.itemHeight + 'px';
                this.scroller.appendChild(el);
                this.visibleItems.set(i, el);
            }
        }

        // Cleanup out of view items
        for (const [i, el] of this.visibleItems.entries()) {
            if (!keepIndices.has(i)) {
                el.remove();
                this.visibleItems.delete(i);
            }
        }
    }
};
