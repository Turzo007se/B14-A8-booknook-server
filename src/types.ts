import type { ObjectId } from "mongodb";
import type { Request } from "express";

export type Claims = { sub?: string; email?: string; name?: string };
export type Book = { title: string; author: string; category: string; image: string; description: string; copies: number; addedBy: string; addedByName: string; createdAt: Date };
export type Borrow = { bookId: ObjectId; title: string; image: string; email: string; borrowDate: Date; returnDate: Date; active: boolean };
export type AuthRequest = Request & { user?: Claims };
