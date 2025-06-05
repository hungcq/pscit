const fs = require('fs');
const axios = require('axios');

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BACKEND_BASE = 'http://localhost:8080/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWQzMGI0NDktNGIxYy00M2RiLTg2MDMtNjNmYWQyNTUwYjU0IiwiZW1haWwiOiJodW5nY3FydEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDg2ODk3ODIsImlhdCI6MTc0ODYwMzM4Mn0.4D168PfOFDtni-_0OdsWhFMFnvcI6-9_d3YpyjFJWjs'; // Replace with your actual JWT token

function stripHtmlTags(input) {
    return input.replace(/<[^>]*>/g, '');
}

function readBooksFromFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

async function searchBook(title, author) {
    let query = `intitle:"${title}" inauthor:"${author}"`;
    if (!author) {
        query = `intitle:"${title}"`;
    }
    const url = `${API_BASE}?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);

    const items = response.data.items || [];

    const filteredItems = items.filter(
        item => item.volumeInfo.language === 'en'
    );
    return filteredItems ? filteredItems[0] : null;
}

async function getBookDetails(selfLink) {
    const response = await axios.get(selfLink);
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

async function processBooks(filePath) {
    const books = readBooksFromFile(filePath);

    for (const book of books) {
        try {
            let searchResult = await searchBook(book.title, book.author);
            if (!searchResult) {
                searchResult = await searchBook(book.title, '');
            }
            if (!searchResult) {
                console.log(`No results found for "${book.title}" by ${book.author}`);
                continue;
            }

            const bookDetails = await getBookDetails(searchResult.selfLink);
            const volumeInfo = bookDetails.volumeInfo;

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

            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            let isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || '';
            let isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || '';
            console.log(industryIdentifiers)
            if (isbn10 === '') {
                isbn10 = industryIdentifiers[0].identifier
            }
            if (isbn13 === '') {
                isbn13 = industryIdentifiers[0].identifier
            }

            const bookPayload = {
                title: volumeInfo.title || book.title,
                subtitle: volumeInfo.subtitle || book.subtitle || '',
                description: stripHtmlTags(volumeInfo.description || book.description || ''),
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
            console.log(`Successfully created book: ${createdBook.title}`);
        } catch (error) {
            console.error(`Error processing "${book.title}":`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Status:', error.response.status);
            }
        }
    }
}

processBooks('/Users/hungcq/projects/pscit/backend/data-test.json');
