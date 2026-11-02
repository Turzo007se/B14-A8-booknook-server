import "dotenv/config";
import app from "./app.js";
import { borrows, client } from "./database.js";

const port = Number(process.env.PORT || 5000);

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await client.connect();
  await borrows.createIndex(
    { bookId: 1, email: 1, active: 1 },
    { unique: true, partialFilterExpression: { active: true } },
  );
  app.listen(port, () => console.log(`BookNook API listening on ${port}`));
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
