const fs = require('fs');
const axios = require('axios');

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BACKEND_BASE = 'http://localhost:8080/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with your actual JWT token

function stripHtmlTags(text) {
    return text?.replace(/<[^>]*>/g, '') || '';
}

async function getBookDetails(volumeId) {
    const url = `${API_BASE}/${volumeId}`;
    const response = await axios.get(url);
    return response.data;
}

async function createAuthor(name) {
    const response = await axios.post(
        `${BACKEND_BASE}/authors`,
        { name, biography: 'Imported via script' },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    return response.data.id;
}

async function createCategory(name, description) {
    const response = await axios.post(
        `${BACKEND_BASE}/categories`,
        { name, description },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    return response.data.id;
}

async function createBook(bookData) {
    const response = await axios.post(
        `${BACKEND_BASE}/books`,
        bookData,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    return response.data;
}

async function processBooksByVolumeIds(filePath) {
    const volumeIds = fs.readFileSync(filePath, 'utf8').split('\n').map(id => id.trim()).filter(Boolean);

    for (const volumeId of volumeIds) {
        try {
            const bookDetails = await getBookDetails(volumeId);
            const volumeInfo = bookDetails.volumeInfo;

            // Create author(s)
            const authorIds = [];
            if (volumeInfo.authors) {
                for (const authorName of volumeInfo.authors) {
                    const authorId = await createAuthor(authorName);
                    authorIds.push(authorId);
                }
            }

            // Create category(ies)
            const categoryIds = [];
            if (volumeInfo.categories) {
                for (const categoryName of volumeInfo.categories) {
                    const categoryId = await createCategory(categoryName, 'Imported category');
                    categoryIds.push(categoryId);
                }
            }

            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            const isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || '';
            const isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || '';

            const bookPayload = {
                title: volumeInfo.title || 'Untitled',
                subtitle: volumeInfo.subtitle || '',
                description: stripHtmlTags(volumeInfo.description || ''),
                isbn_10: isbn10,
                isbn_13: isbn13,
                published_year: parseInt(volumeInfo.publishedDate) || 0,
                page_count: volumeInfo.pageCount || 0,
                publisher: volumeInfo.publisher || '',
                google_volume_id: bookDetails.id,
                author_ids: authorIds,
                category_ids: categoryIds,
                main_image: volumeInfo.imageLinks?.thumbnail || ''
            };

            const createdBook = await createBook(bookPayload);
            console.log(`Successfully created book: ${createdBook.title}`);
        } catch (error) {
            if (error.response) {
                console.error(`Error processing volume ID "${volumeId}":`, {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else {
                console.error(`Error processing volume ID "${volumeId}":`, error.message);
            }
        }
    }
}

// Run with path to txt file containing volume IDs
processBooksByVolumeIds('/path/to/volume_ids.txt');