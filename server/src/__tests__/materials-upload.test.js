import request from "supertest";
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// node --test runs each file in its own process, so the in-memory store here
// starts fresh -- these tests don't see mutations made by other test files.
const app = createApp();

async function login(email) {
  const response = await request(app).post("/api/auth/login").send({ email, password: "Password123!" });
  return response.body.token;
}

// #57: POST /api/materials must reject disallowed types/oversized files with
// a clear error, and store metadata (title, type, size, uploader, linked
// students) for allowed ones. This endpoint had no direct test coverage --
// its validation was only exercised indirectly via the shared fileValidation
// helpers used by messages attachments.
test("#57: rejects a disallowed file type with a clear error", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const response = await request(app)
    .post("/api/materials")
    .set("Authorization", `Bearer ${tutorToken}`)
    .field("title", "Not allowed")
    .field("public", "true")
    .attach("file", Buffer.from("bad"), { filename: "malware.exe", contentType: "application/x-msdownload" })
    .expect(400);
  assert.match(response.body.message, /PDF, DOCX, PNG, and MP4/);
});

test("#57: rejects an oversized file with a clear error, not a raw crash", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const oversized = Buffer.alloc(51 * 1024 * 1024, 1);
  const response = await request(app)
    .post("/api/materials")
    .set("Authorization", `Bearer ${tutorToken}`)
    .field("title", "Too big")
    .field("public", "true")
    .attach("file", oversized, { filename: "huge.mp4", contentType: "video/mp4" })
    .expect(400);
  assert.match(response.body.message, /50MB/);
});

test("#57: an allowed upload stores full metadata -- title, type, size, uploader, linked students", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const created = await request(app)
    .post("/api/materials")
    .set("Authorization", `Bearer ${tutorToken}`)
    .field("title", "Week 3 practice sheet")
    .field("public", "false")
    .field("linkedStudentIds", "u-student")
    .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "practice.pdf", contentType: "application/pdf" })
    .expect(201);

  const material = created.body.material;
  assert.equal(material.title, "Week 3 practice sheet");
  assert.equal(material.mimeType, "application/pdf");
  assert.equal(material.size, 13);
  assert.equal(material.uploaderId, "u-tutor");
  assert.deepEqual(material.linkedStudentIds, ["u-student"]);
  assert.equal(material.public, false);

  // Metadata actually persists -- a fresh fetch by the linked student sees it.
  const studentView = await request(app).get("/api/materials").set("Authorization", `Bearer ${studentToken}`).expect(200);
  assert.ok(studentView.body.materials.some((item) => item.id === material.id));
});
