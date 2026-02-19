export const BooksConfig = {
    match: (url) => url.includes('books.zoho'),
    save: ['#save_script', '.save-btn', 'input[value="Save"]'],
    execute: ['#execute_script', '.execute-btn']
};
