import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import booksRouter from "./routes/books.js";
import borrowsRouter from "./routes/borrows.js";

const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:3000").split(","), credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "booknook-api" }));
app.use("/books", booksRouter);
app.use("/borrows", borrowsRouter);
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

export default app;
