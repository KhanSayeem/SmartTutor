export const maxFileSize = 50 * 1024 * 1024;

export const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "video/mp4"
]);

export const maxAvatarSize = 2 * 1024 * 1024;

export const allowedAvatarMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateAvatar(file) {
  if (!file) return "Image is required";
  if (!allowedAvatarMimeTypes.has(file.mimetype)) return "Only PNG, JPEG, and WebP images are allowed";
  if (file.size > maxAvatarSize) return "Image must be 2MB or smaller";
  return null;
}

export function validateUpload(file) {
  if (!file) return "File is required";
  if (!allowedMimeTypes.has(file.mimetype)) return "Only PDF, DOCX, PNG, and MP4 files are allowed";
  if (file.size > maxFileSize) return "File must be 50MB or smaller";
  return null;
}
