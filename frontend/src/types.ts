export interface User {
  id: string;
  email: string;
  name: string;
  google_id: string;
  role: 'user' | 'admin';
  subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  isbn10: string;
  isbn13: string;
  main_image: string;
  authors: Author[];
  categories: Category[];
  published_year: number;
  publisher: string;
  page_count: number;
  format: 'paperback' | 'hardcover';
  google_volume_id: string;
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
  book_id: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  status: 'available' | 'borrowed' | 'reserved';
  notes?: string;
  book: Book;
}

export interface Reservation {
  id: string;
  user_id: string;
  book_copy_id: string;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at: string;
  updated_at: string;
  user?: User;
  book_copy: BookCopy;
  suggested_pickup_timeslots?: string[];
  suggested_return_timeslots?: string[];
}
