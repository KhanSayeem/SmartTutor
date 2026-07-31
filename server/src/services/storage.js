import { nanoid } from "nanoid";

export async function saveUploadedFile(file, folder = "uploads") {
  return {
    storagePath: `${folder}/${nanoid(10)}-${file.originalname}`,
    url: `smarttutor://${folder}/${file.originalname}`
  };
}
