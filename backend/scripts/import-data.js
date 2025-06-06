const fs = require('fs');
const axios = require('axios');

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BACKEND_BASE = 'http://localhost:8000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMGJmN2NmMzQtYTUwMC00MmM5LWE4YmMtYmI1MmE3YjgwMDY1IiwiZW1haWwiOiJodW5nY3FydEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDkyMjUxODUsImlhdCI6MTc0OTEzODc4NX0.QOtWPcSs_bRk_3oiZ-yjj7zSbUP09Vqh2xNVTUgWi0g';

function stripHtmlTags(text) {
    return text?.replace(/<[^>]*>/g, '') || '';
}

async function getBookDetails(isbn13) {
    const url = `${API_BASE}?q=isbn:${isbn13}`;
    const response = await axios.get(url);
    const items = response.data.items || [];
    const link = items[0].selfLink
    const details = await axios.get(link);
    return details.data
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

async function processBooksByIsbn13s(filePath) {
    const isbn13s = fs.readFileSync(filePath, 'utf8').split('\n').map(id => id.trim()).filter(Boolean);

    for (const isbn of isbn13s) {
        try {
            const bookDetails = await getBookDetails(isbn);
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
                isbn10: isbn10,
                isbn13: isbn13,
                published_year: parseInt(volumeInfo.publishedDate) || 0,
                page_count: volumeInfo.pageCount || 0,
                publisher: volumeInfo.publisher || '',
                google_volume_id: bookDetails.id,
                author_ids: authorIds,
                category_ids: categoryIds,
                main_image: volumeInfo.imageLinks?.thumbnail || ''
            };

            const createdBook = await createBook(bookPayload);
            console.log(`Successfully created book: ${createdBook.title}, isbn13: ${isbn13}`);
        } catch (error) {
            if (error.response) {
                console.error(`Error processing volume ID "${isbn}":`, {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else {
                console.error(`Error processing ISBN13 "${isbn}":`, error.message);
            }
        }
    }
}

processBooksByIsbn13s('/Users/hungcq/Desktop/isbns.txt');