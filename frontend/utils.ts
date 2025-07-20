import {Book} from "./types";

export const getBookImageUrl = (book: Book): string => {
    return process.env.NEXT_PUBLIC_ENV === 'dev' ? book.main_image : `https://pscit.hungcq.com/book-images/${book.id}.jpg`;
};