import cors from "cors";
import express from "express";
import multer from "multer";
import { ZodError } from "zod";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { materialsRouter } from "./routes/materials.js";
import { messagesRouter } from "./routes/messages.js";
import { progressRouter } from "./routes/progress.js";
import { tutorsRouter } from "./routes/tutors.js";

// LIMIT_FILE_SIZE errors carry the field name but not the configured limit
// that tripped, and different upload fields use different limits (avatars:
// 2MB, materials/message attachments: 50MB) -- this maps the field back to
// the right human message instead of guessing a single size for all of them.
const fileSizeMessageByField = {
  avatar: "Image must be 2MB or smaller",
  file: "File must be 50MB or smaller"
};

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "smarttutor-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/tutors", tutorsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/materials", materialsRouter);
  app.use("/api/progress", progressRouter);

  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        details: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]))
      });
    }

    // Multer throws for oversized/malformed uploads before a route handler
    // (and its own validateUpload() 400) ever runs, so it previously fell
    // through to the generic 500 branch below.
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE" ? fileSizeMessageByField[error.field] || "Uploaded file is too large" : error.message;
      return res.status(400).json({ message });
    }

    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Unexpected server error",
      details: error.details
    });
  });

  return app;
}
