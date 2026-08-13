import { nanoid } from "nanoid";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "smarttutor-uploads";

export const storageMode = supabaseUrl && supabaseServiceKey ? "supabase" : "stub";

function safeName(originalname = "file") {
  return originalname.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
}

// Supabase Storage over its REST endpoint. The service-role key never leaves the
// server, so the bucket itself stays private to anonymous writers; reads go
// through the public URL only because avatars are meant to be publicly visible.
async function uploadToSupabase(file, storagePath) {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${supabaseBucket}/${storagePath}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": file.mimetype || "application/octet-stream",
      "x-upsert": "true"
    },
    body: file.buffer
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase Storage upload failed (${response.status}): ${body}`);
  }
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${supabaseBucket}/${storagePath}`;
}

export async function saveUploadedFile(file, folder = "uploads") {
  const storagePath = `${folder}/${nanoid(10)}-${safeName(file.originalname)}`;
  if (storageMode === "supabase") {
    return { storagePath, url: await uploadToSupabase(file, storagePath) };
  }
  // Unconfigured local/dev runs keep the previous placeholder contract so the
  // rest of the app behaves identically without Supabase credentials.
  return { storagePath, url: `smarttutor://${storagePath}` };
}
