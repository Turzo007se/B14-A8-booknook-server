import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAuth } from "../auth.js";
import { books, borrows } from "../database.js";
import { safeBorrow } from "../serializers.js";
import type { AuthRequest, Borrow } from "../types.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = req.body;
    if (typeof bookId !== "string" || !ObjectId.isValid(bookId)) { res.status(400).json({ message: "A valid book id is required." }); return; }
    const oid = new ObjectId(bookId), email = req.user!.email!;
    if (await borrows.findOne({ bookId: oid, email, active: true })) { res.status(409).json({ message: "You already have this book checked out." }); return; }
    const book = await books.findOneAndUpdate({ _id: oid, copies: { $gt: 0 } }, { $inc: { copies: -1 } }, { returnDocument: "after" });
    if (!book) { res.status(409).json({ message: "This book is currently unavailable." }); return; }
    const now = new Date(), due = new Date(now);
    due.setDate(due.getDate() + 14);
    const borrow: Borrow = { bookId: oid, title: book.title, image: book.image, email, borrowDate: now, returnDate: due, active: true };
    try {
      const inserted = await borrows.insertOne(borrow);
      res.status(201).json(safeBorrow({ ...borrow, _id: inserted.insertedId } as Borrow & { _id: ObjectId }));
    } catch (error) {
      await books.updateOne({ _id: oid }, { $inc: { copies: 1 } });
      throw error;
    }
  } catch (error) { next(error); }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const rows = await borrows.find({ email: req.user!.email, active: true }).sort({ borrowDate: -1 }).toArray();
    res.json(rows.map(safeBorrow));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) { res.status(400).json({ message: "Invalid borrow id." }); return; }
    const result = await borrows.findOneAndDelete({ _id: new ObjectId(req.params.id), email: req.user!.email, active: true });
    if (!result) { res.status(404).json({ message: "Active borrow not found." }); return; }
    await books.updateOne({ _id: result.bookId }, { $inc: { copies: 1 } });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
