import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAuth } from "../auth.js";
import { books, borrows } from "../database.js";
import { safeBook, validBook } from "../serializers.js";
import type { AuthRequest, Book } from "../types.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const cursor = books.find().sort({ createdAt: -1 });
    const limit = Number(req.query.limit);
    if (Number.isInteger(limit) && limit > 0) cursor.limit(Math.min(limit, 100));
    res.json((await cursor.toArray()).map(safeBook));
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) { res.status(400).json({ message: "Invalid book id." }); return; }
    const book = await books.findOne({ _id: new ObjectId(req.params.id) });
    if (!book) { res.status(404).json({ message: "Book not found." }); return; }
    res.json(safeBook(book));
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!validBook(req.body)) { res.status(400).json({ message: "Please provide a valid book title, author, category, image URL, description, and copy count." }); return; }
    const book: Book = { ...req.body, addedBy: req.user!.email!, addedByName: req.user!.name || req.user!.email!, createdAt: new Date() };
    const result = await books.insertOne(book);
    res.status(201).json(safeBook({ ...book, _id: result.insertedId } as Book & { _id: ObjectId }));
  } catch (error) { next(error); }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) { res.status(400).json({ message: "Invalid book id." }); return; }
    if (!validBook(req.body)) { res.status(400).json({ message: "Please provide valid book details." }); return; }
    const result = await books.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), addedBy: req.user!.email },
      { $set: { title: req.body.title, author: req.body.author, category: req.body.category, image: req.body.image, description: req.body.description, copies: req.body.copies } },
      { returnDocument: "after" },
    );
    if (!result) { res.status(404).json({ message: "Book not found or you do not own it." }); return; }
    res.json(safeBook(result));
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) { res.status(400).json({ message: "Invalid book id." }); return; }
    const bookId = new ObjectId(req.params.id);
    const result = await books.deleteOne({ _id: bookId, addedBy: req.user!.email });
    if (!result.deletedCount) { res.status(404).json({ message: "Book not found or you do not own it." }); return; }
    await borrows.updateMany({ bookId, active: true }, { $set: { active: false } });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
