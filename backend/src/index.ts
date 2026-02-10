import express from "express";
import cors from "cors";
import { initDb } from "./database/database";
import formsRouter from "./routes/forms";
import fieldsRouter from "./routes/fields";
import clientsRouter from "./routes/clients";
import responsesRouter from "./routes/responses";
import publicFormsRouter from "./routes/publicForms";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Initialize database (creates backend/data/forms.db if it doesn't exist)
initDb();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(formsRouter);
app.use(fieldsRouter);
app.use(clientsRouter);
app.use(responsesRouter);
app.use(publicFormsRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
