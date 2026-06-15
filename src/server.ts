import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import router from "./router.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// All routes
app.use("/api", router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});