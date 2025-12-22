import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
  const { stream, semester, regulation = "2020" } = req.query;

  if (!stream || !semester) {
    return res.status(400).json({
      error: "stream and semester are required"
    });
  }

  try {
    const filePath = path.resolve(
      "data",
      `${stream.toLowerCase()}.json`
    );

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const subjects =
      data.regulations?.[regulation]?.[semester];

    if (!subjects) {
      return res.status(404).json({
        error: "No subjects found for given semester"
      });
    }

    res.json({
      stream,
      regulation,
      semester: Number(semester),
      subjects
    });

  } catch (err) {
    res.status(500).json({
      error: "Invalid stream or server error"
    });
  }
});

export default router;
