import axios, {AxiosError} from 'axios';
import {Author, Book, BookCopy, CartItem, Category, Reservation, Tag} from './types';

interface ErrorResponse {
    error: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration and error messages
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorResponse>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        // Extract error message from backend response
        const errorMessage = error.response?.data?.error || 'An error occurred';
        return Promise.reject(new Error(errorMessage));
    }
);

// Books API
export const booksAPI = {
    getBooks: (query?: string, category?: string, author?: string, language?: string, tagKey?: string, page = 1, limit = 12, sortField?: string, sortOrder?: string) =>
        api.get<{ books: Book[]; total: number }>('/books', {
            params: { query, category, author, language, page, limit, sortField, sortOrder, tag_key: tagKey },
        }),
    getBook: (id: string) => api.get<Book>(`/books/${id}`),
    createBook: (book: Partial<Book>) => api.post<Book>('/books', book),
    updateBook: (id: string, book: Partial<Book>) => api.put<Book>(`/books/${id}`, book),
    deleteBook: (id: string) => api.delete(`/books/${id}`),
};

// Book Copies API
export const bookCopiesAPI = {
    getBookCopies: (bookId: string) => api.get<BookCopy[]>(`/books/${bookId}/copies`),
    createBookCopy: (bookId: string, copy: Partial<BookCopy>) =>
        api.post<BookCopy>(`/books/${bookId}/copies`, copy),
    updateBookCopy: (id: string, copy: Partial<BookCopy>) =>
        api.put<BookCopy>(`/books/copies/${id}`, copy),
    deleteBookCopy: (id: string) => api.delete(`/books/copies/${id}`),
};

// Reservations API
export const reservationsAPI = {
    getReservations: (page = 1, limit = 10, filters?: { email?: string; status?: string; bookTitle?: string }) =>
        api.get<{ reservations: Reservation[]; total: number }>('/reservations', {
            params: {
                page,
                limit,
                email: filters?.email,
                status: filters?.status,
                book_title: filters?.bookTitle
            },
        }),
    getUserReservations: (page = 1, limit = 10) =>
        api.get<{ reservations: Reservation[]; total: number }>('/reservations/user', {
            params: { page, limit },
        }),
    createReservation: (data: {
        bookCopyId: string;
        startDate: string;
        endDate: string;
        suggestedPickupTimeslots: string[];
        suggestedReturnTimeslots: string[];
    }) =>
        api.post<Reservation>('/reservations', {
            book_copy_id: data.bookCopyId,
            start_date: data.startDate,
            end_date: data.endDate,
            suggested_pickup_timeslots: data.suggestedPickupTimeslots,
            suggested_return_timeslots: data.suggestedReturnTimeslots,
        }),
    updateReservation: (id: string, status: string, pickupTime?: string, returnTime?: string) =>
        api.put<Reservation>(`/reservations/${id}/status`, {
            status,
            pickup_time: pickupTime,
            return_time: returnTime
        }),
};

// Authors API
export const authorsAPI = {
    getAuthors: () => api.get<Author[]>('/authors'),
    createAuthor: (author: Partial<Author>) => api.post<Author>('/authors', author),
    updateAuthor: (id: string, author: Partial<Author>) => api.put<Author>(`/authors/${id}`, author),
    deleteAuthor: (id: string) => api.delete(`/authors/${id}`),
};

// Categories API
export const categoriesAPI = {
    getCategories: () => api.get<Category[]>('/categories'),
    createCategory: (category: Partial<Category>) => api.post<Category>('/categories', category),
    updateCategory: (id: string, category: Partial<Category>) => api.put<Category>(`/categories/${id}`, category),
    deleteCategory: (id: string) => api.delete(`/categories/${id}`),
};

// Cart API
export const cartAPI = {
    getCartItems: () => api.get<CartItem[]>('/cart'),
    addToCart: (bookCopyId: string) => api.post('/cart', { book_copy_id: bookCopyId }),
    removeFromCart: (bookCopyId: string) => api.delete(`/cart/${bookCopyId}`),
    clearCart: () => api.delete('/cart'),
    checkoutCart: (data: {
        startDate: string;
        endDate: string;
        suggestedPickupTimeslots: string[];
        suggestedReturnTimeslots: string[];
    }) => api.post<Reservation>('/reservations', {
        start_date: data.startDate,
        end_date: data.endDate,
        suggested_pickup_timeslots: data.suggestedPickupTimeslots,
        suggested_return_timeslots: data.suggestedReturnTimeslots,
    }),
};

// Tags API
export const tagsAPI = {
    getTags: () => api.get<Tag[]>('/tags'),
    createTag: (tag: Partial<Tag>) => api.post<Tag>('/tags', tag),
    updateTag: (id: string, tag: Partial<Tag>) => api.put<Tag>(`/tags/${id}`, tag),
    deleteTag: (id: string) => api.delete(`/tags/${id}`),
};

export default api; 