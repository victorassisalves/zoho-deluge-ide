export function getZohoProduct() {
    const h = window.location.hostname;
    if (h.includes('crm')) return 'crm';
    if (h.includes('creator')) return 'creator';
    if (h.includes('books')) return 'books';
    if (h.includes('recruit')) return 'recruit';
    return 'generic';
}
