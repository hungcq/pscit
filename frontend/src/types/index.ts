export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  isbn: string;
  main_image: string;
  available: boolean;
  authors: Author[];
  categories: Category[];
}

export interface Author {
  id: string;
  name: string;
  biography: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  available: boolean;
  notes?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  bookCopyId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  book: Book;
  bookCopy: BookCopy;
}

export interface CreateReservationRequest {
  bookCopyId: string;
  startDate: Date;
  endDate: Date;
}