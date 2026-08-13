import multer from "multer";
import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { saveUploadedFile } from "../services/storage.js";
import { forbidden, notFound } from "../utils/errors.js";
import { validateUpload } from "../utils/fileValidation.js";

export const materialsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

materialsRouter.use(requireAuth);

materialsRouter.get("/", (req, res) => {
  const rows = store.materials.filter((material) => {
    if (req.user.role === "admin") return true;
    if (req.user.role === "tutor") return material.uploaderId === req.user.id;
    return material.public || material.linkedStudentIds.includes(req.user.id);
  });
  res.json({ materials: rows });
});

materialsRouter.post("/", permit("tutor"), upload.single("file"), async (req, res, next) => {
  try {
    const validationError = validateUpload(req.file);
    if (validationError) return res.status(400).json({ message: validationError });
    const saved = await saveUploadedFile(req.file, "materials");
    const material = {
      id: `mat-${nanoid(8)}`,
      title: req.body.title || req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploaderId: req.user.id,
      linkedStudentIds: String(req.body.linkedStudentIds || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
      public: req.body.public === "true",
      storagePath: saved.storagePath,
      url: saved.url,
      createdAt: new Date().toISOString()
    };
    store.materials.unshift(material);
    res.status(201).json({ material });
  } catch (error) {
    next(error);
  }
});

materialsRouter.delete("/:id", permit("tutor", "admin"), (req, res, next) => {
  try {
    const index = store.materials.findIndex((material) => material.id === req.params.id);
    if (index < 0) throw notFound("Material not found");
    const material = store.materials[index];
    if (req.user.role === "tutor" && material.uploaderId !== req.user.id) throw forbidden();
    store.materials.splice(index, 1);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

materialsRouter.get("/:id/download", (req, res, next) => {
  try {
    const material = store.materials.find((item) => item.id === req.params.id);
    if (!material) throw notFound("Material not found");
    const allowed =
      req.user.role === "admin" ||
      material.uploaderId === req.user.id ||
      material.public ||
      material.linkedStudentIds.includes(req.user.id);
    if (!allowed) throw forbidden("You do not have access to this material");
    // When Supabase Storage is configured, material.url is a real public file
    // URL -- redirect there so the client downloads the actual bytes. Only
    // the unconfigured local stub (a smarttutor:// placeholder scheme) falls
    // back to a synthetic response, since there is no real file to serve.
    if (/^https?:\/\//.test(material.url)) {
      return res.redirect(material.url);
    }
    res.setHeader("Content-Type", material.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${material.title}"`);
    res.send(`SmartTutor demo file placeholder for ${material.title}\nStorage path: ${material.storagePath}`);
  } catch (error) {
    next(error);
  }
});
