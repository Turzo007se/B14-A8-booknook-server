import type { Document } from "mongodb";
import type { Book, Borrow } from "./types.js";

export function safeBook(book: Book & Document) {
  return { ...book, _id: book._id.toString(), createdAt: new Date(book.createdAt).toISOString() };
}

export function safeBorrow(borrow: Borrow & Document) {
  return {
    ...borrow,
    _id: borrow._id.toString(),
    bookId: borrow.bookId.toString(),
    borrowDate: new Date(borrow.borrowDate).toISOString(),
    returnDate: new Date(borrow.returnDate).toISOString(),
  };
}

export function validBook(body: Partial<Book>) {
  return typeof body.title === "string" && !!body.title.trim()
    && typeof body.author === "string" && !!body.author.trim()
    && ["Fiction", "Science", "History", "Kids", "Others"].includes(body.category || "")
    && typeof body.image === "string" && /^https?:\/\//.test(body.image)
    && typeof body.description === "string"
    && Number.isInteger(body.copies) && Number(body.copies) >= 0;
}
