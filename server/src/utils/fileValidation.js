export const maxFileSize = 50 * 1024 * 1024;

export const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "video/mp4"
]);

export function validateUpload(file) {
  if (!file) return "File is required";
  if (!allowedMimeTypes.has(file.mimetype)) return "Only PDF, DOCX, PNG, and MP4 files are allowed";
  if (file.size > maxFileSize) return "File must be 50MB or smaller";
  return null;
}
