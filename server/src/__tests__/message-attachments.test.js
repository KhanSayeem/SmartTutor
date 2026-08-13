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

test("uploading a message attachment returns metadata usable on the message send call", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);
  const conversationId = accept.body.conversationId;

  const uploaded = await request(app)
    .post(`/api/messages/conversations/${conversationId}/attachments`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "worksheet.pdf", contentType: "application/pdf" })
    .expect(201);

  assert.equal(uploaded.body.attachment.title, "worksheet.pdf");
  assert.equal(uploaded.body.attachment.mimeType, "application/pdf");
  assert.ok(uploaded.body.attachment.url);

  const sent = await request(app)
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({ body: "Here's the worksheet", attachments: [uploaded.body.attachment] })
    .expect(201);
  assert.equal(sent.body.message.attachments.length, 1);
  assert.equal(sent.body.message.attachments[0].title, "worksheet.pdf");

  const view = await request(app)
    .get(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${studentToken}`)
    .expect(200);
  assert.ok(view.body.messages.some((message) => message.attachments?.[0]?.title === "worksheet.pdf"));
});

test("rejects disallowed file types and oversized files with the same rules as materials", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);
  const conversationId = accept.body.conversationId;

  const rejected = await request(app)
    .post(`/api/messages/conversations/${conversationId}/attachments`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .attach("file", Buffer.from("bad"), { filename: "malware.exe", contentType: "application/x-msdownload" })
    .expect(400);
  assert.match(rejected.body.message, /PDF, DOCX, PNG, and MP4/);
});

test("a non-participant cannot upload an attachment to someone else's conversation", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const liamToken = await login("liam@smarttutor.local");

  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);
  const conversationId = accept.body.conversationId;

  await request(app)
    .post(`/api/messages/conversations/${conversationId}/attachments`)
    .set("Authorization", `Bearer ${liamToken}`)
    .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "worksheet.pdf", contentType: "application/pdf" })
    .expect(403);
});

test("a message with only an attachment and no text is accepted, but an empty message with neither is rejected", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);
  const conversationId = accept.body.conversationId;

  const uploaded = await request(app)
    .post(`/api/messages/conversations/${conversationId}/attachments`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .attach("file", Buffer.from("fake png"), { filename: "diagram.png", contentType: "image/png" })
    .expect(201);

  const sent = await request(app)
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({ attachments: [uploaded.body.attachment] })
    .expect(201);
  assert.equal(sent.body.message.body, "");

  await request(app)
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(400);
});
