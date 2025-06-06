export const getBookImageUrl = (bookId: string): string => {
    return import.meta.env.VITE_ENV === 'dev' ? '' : `https://pscit.hungcq.xyz/book-images/${bookId}`;
};