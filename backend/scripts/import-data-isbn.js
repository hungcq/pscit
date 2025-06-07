const fs = require('fs');
const axios = require('axios');

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BACKEND_BASE = 'http://localhost:8000/api';
const AUTH_TOKEN = ''

function stripHtmlTags(input) {
    return input.replace(/<[^>]*>/g, '');
}

async function searchBookByISBN(isbn) {
    const url = `${API_BASE}?q=isbn:${isbn}`;
    const response = await axios.get(url);
    const items = response.data.items || [];
    return items.length > 0 ? items[0] : null;
}

async function getBookDetails(selfLink) {
    const response = await axios.get(selfLink);
    return response.data;
}

async function createAuthor(name) {
    try {
        const response = await axios.post(
            `${BACKEND_BASE}/authors`,
            { name, biography: 'Imported via script' },
            { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
        );
        return response.data.id;
    } catch (error) {
        if (error.response?.status === 400) {
            // Author might already exist, try to find them
            const searchResponse = await axios.get(
                `${BACKEND_BASE}/authors?query=${encodeURIComponent(name)}`,
                { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
            );
            if (searchResponse.data.length > 0) {
                return searchResponse.data[0].id;
            }
        }
        throw error;
    }
}

async function createCategory(name, description) {
    try {
        const response = await axios.post(
            `${BACKEND_BASE}/categories`,
            { name, description },
            { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
        );
        return response.data.id;
    } catch (error) {
        if (error.response?.status === 400) {
            // Category might already exist, try to find it
            const searchResponse = await axios.get(
                `${BACKEND_BASE}/categories?query=${encodeURIComponent(name)}`,
                { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
            );
            if (searchResponse.data.length > 0) {
                return searchResponse.data[0].id;
            }
        }
        throw error;
    }
}

async function checkBookExists(isbn) {
    try {
        const params = new URLSearchParams();
        if (isbn.length === 10) {
            params.append('isbn10', isbn);
        }
        if (isbn.length === 13) {
            params.append('isbn13', isbn);
        }

        const url = `${BACKEND_BASE}/books?${params.toString()}`
        
        const response = await axios.get(
            url,
            { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
        );
        
        return response.data.books.length > 0 ? response.data.books[0] : null;
    } catch (error) {
        console.error('Error checking for existing book:', error.message);
        return null;
    }
}

async function createBook(bookData) {
    const response = await axios.post(
        `${BACKEND_BASE}/books`,
        bookData,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    return response.data;
}

async function processBooks(filePath) {
    const isbn13s = fs.readFileSync(filePath, 'utf8').split('\n').map(id => id.trim()).filter(Boolean);

    for (const isbn of isbn13s) {
        try {
            // Check if book already exists
            const existingBook = await checkBookExists(isbn);
            if (existingBook) {
                // console.log(`Book already exists: ${existingBook.title} (ISBN: ${isbn})`);
                continue;
            }

            // First try to find the book by ISBN
            let searchResult = await searchBookByISBN(isbn);

            if (!searchResult) {
                console.log(`No results found for ISBN: ${isbn}`);
                continue;
            }

            const bookDetails = await getBookDetails(searchResult.selfLink);
            const volumeInfo = bookDetails.volumeInfo;

            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            let isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || '';
            let isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || '';

            console.log('isbn10', isbn10)

            const authorIds = [];
            if (volumeInfo.authors) {
                for (const authorName of volumeInfo.authors) {
                    const authorId = await createAuthor(authorName);
                    authorIds.push(authorId);
                }
            }

            const categoryIds = [];
            if (volumeInfo.categories) {
                for (const categoryName of volumeInfo.categories) {
                    const categoryId = await createCategory(categoryName, 'Imported category');
                    categoryIds.push(categoryId);
                }
            }

            // Determine format based on book details
            const format = volumeInfo.printType === 'BOOK' ? 'paperback' : 'hardcover';

            const bookPayload = {
                title: volumeInfo.title,
                subtitle: volumeInfo.subtitle || '',
                description: stripHtmlTags(volumeInfo.description || ''),
                isbn10: isbn10 || null,
                isbn13: isbn13 || null,
                published_year: parseInt(volumeInfo.publishedDate) || 0,
                page_count: volumeInfo.pageCount || 0,
                publisher: volumeInfo.publisher || '',
                google_volume_id: bookDetails.id,
                main_image: volumeInfo.imageLinks?.thumbnail || '',
                format: format,
                author_ids: authorIds,
                category_ids: categoryIds
            };

            const createdBook = await createBook(bookPayload);
            console.log(`Successfully created book: ${createdBook.title}`);
        } catch (error) {
            console.error(`Error processing book with ISBN ${isbn}:`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Status:', error.response.status);
            }
        }
    }
}

// Example usage:
processBooks('/Users/hungcq/drive/isbns.txt');