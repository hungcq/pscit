import axios from 'axios';
import {Author, Book, BookCopy, Category, CreateReservationRequest, Reservation, User} from '../types';

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

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post<{ token: string; user: User }>('/auth/login', { email, password }),
    register: (username: string, email: string, password: string) =>
        api.post<{ token: string; user: User }>('/auth/register', {
            username,
            email,
            password,
        }),
    getCurrentUser: () => api.get<User>('/auth/me'),
};

// Books API
export const booksAPI = {
    getBooks: (query?: string, category?: string, author?: string, page = 1, limit = 12) =>
        api.get<{ books: Book[]; total: number }>('/books', {
            params: { query, category, author, page, limit },
        }),
    getBook: (id: string) => api.get<Book>(`/books/${id}`),
    getBookCopies: (bookId: string) => api.get<BookCopy[]>(`/books/${bookId}/copies`),
    createBook: (book: Partial<Book>) => api.post<Book>('/books', book),
    updateBook: (id: string, book: Partial<Book>) => api.put<Book>(`/books/${id}`, book),
    deleteBook: (id: string) => api.delete(`/books/${id}`),
};

// Book Copies API
export const bookCopiesAPI = {
    getBookCopies: (bookId: string) => api.get<BookCopy[]>(`/books/${bookId}/copies`),
    getBookCopy: (id: string) => api.get<BookCopy>(`/book-copies/${id}`),
    createBookCopy: (bookId: string, copy: Partial<BookCopy>) =>
        api.post<BookCopy>(`/books/${bookId}/copies`, copy),
    updateBookCopy: (id: string, copy: Partial<BookCopy>) =>
        api.put<BookCopy>(`/book-copies/${id}`, copy),
    deleteBookCopy: (id: string) => api.delete(`/book-copies/${id}`),
    bulkCreateBookCopies: (bookId: string, count: number, condition: BookCopy['condition']) =>
        api.post<BookCopy[]>(`/books/${bookId}/copies/bulk`, { count, condition }),
    updateBookCopyAvailability: (id: string, available: boolean) =>
        api.patch<BookCopy>(`/book-copies/${id}/availability`, { available }),
};

// Reservations API
export const reservationsAPI = {
    getReservations: (page = 1, limit = 10) =>
        api.get<{ reservations: Reservation[]; total: number }>('/reservations', {
            params: { page, limit },
        }),
    getUserReservations: () => api.get<Reservation[]>('/reservations/user'),
    getReservation: (id: string) => api.get<Reservation>(`/reservations/${id}`),
    createReservation: (reservation: CreateReservationRequest) =>
        api.post<Reservation>('/reservations', reservation),
    updateReservation: (id: string, status: Reservation['status']) =>
        api.patch<Reservation>(`/reservations/${id}`, { status }),
    deleteReservation: (id: string) => api.delete(`/reservations/${id}`),
};

// User API
export const userAPI = {
    updateProfile: async (userData: Partial<User>) => {
        const response = await api.put('/users/profile', userData);
        return response.data;
    },

    toggleSubscription: async () => {
        const response = await api.put('/users/subscription');
        return response.data;
    },
};

// Authors API
export const authorsAPI = {
    getAuthors: () => api.get<Author[]>('/authors'),
    getAuthor: (id: string) => api.get<Author>(`/authors/${id}`),
    createAuthor: (author: Partial<Author>) => api.post<Author>('/authors', author),
    updateAuthor: (id: string, author: Partial<Author>) => api.put<Author>(`/authors/${id}`, author),
    deleteAuthor: (id: string) => api.delete(`/authors/${id}`),
};

// Categories API
export const categoriesAPI = {
    getCategories: () => api.get<Category[]>('/categories'),
    getCategory: (id: string) => api.get<Category>(`/categories/${id}`),
    createCategory: (category: Partial<Category>) => api.post<Category>('/categories', category),
    updateCategory: (id: string, category: Partial<Category>) => api.put<Category>(`/categories/${id}`, category),
    deleteCategory: (id: string) => api.delete(`/categories/${id}`),
};

export default api; 