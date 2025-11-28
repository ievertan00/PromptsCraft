import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./initDb.js";
import authRoutes from "./routes/authRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// For resolving __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = express();
  const port = parseInt(process.env.PORT || "3001");

  // Initialize database schema
  await initDb();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/folders", folderRoutes);
  app.use("/api/prompts", promptRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/ai", aiRoutes);

  // Health check endpoint for Render - keep it on a specific path
  app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "PromptsCraft server is running" });
  });

  // Serve static files from the React app build directory (production only)
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "public")));

    // Serve React app for any non-API routes
    app.get(/^(?!\/api\/).*$/, (req, res) => {
      const indexPath = path.join(__dirname, "public", "index.html");
      res.sendFile(indexPath);
    });
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

main();
