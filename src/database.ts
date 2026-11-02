import { MongoClient, type Collection, type Document } from "mongodb";
import type { Book, Borrow } from "./types.js";

export const client = new MongoClient(process.env.MONGODB_URI || "");
export const database = client.db(process.env.MONGODB_DATABASE || "booknook");
export const books: Collection<Book & Document> = database.collection("books");
export const borrows: Collection<Borrow & Document> = database.collection("borrows");
