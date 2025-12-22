import express from "express";
import cors from "cors";
import subjectsRouter from "./routes/subjects.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MAKAUT Subjects API is running");
});

app.use("/api/subjects", subjectsRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
