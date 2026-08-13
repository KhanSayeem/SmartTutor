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

// #11: profile edit form must validate input, and changes must persist and
// reload correctly.
test("#11: PATCH /auth/me validates input and rejects a malformed phone number", async () => {
  const token = await login("student@smarttutor.local");
  const response = await request(app)
    .patch("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Avery Chen", phone: "not-a-phone!!", subjects: ["Mathematics"] })
    .expect(400);
  assert.ok(response.body.details?.phone, "should report the phone field specifically");
});

test("#11: PATCH /auth/me rejects a tutor-only field (price) from a student", async () => {
  const token = await login("student@smarttutor.local");
  await request(app)
    .patch("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ price: 999 })
    .expect(400);
});

test("#11: profile changes persist and reload correctly on a fresh GET", async () => {
  const token = await login("student@smarttutor.local");
  await request(app)
    .patch("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Avery C. Chen", phone: "+61 400 111 222", subjects: ["Mathematics", "Chemistry"] })
    .expect(200);

  const reloaded = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(reloaded.body.user.name, "Avery C. Chen");
  assert.equal(reloaded.body.user.phone, "+61 400 111 222");
  assert.deepEqual(reloaded.body.user.subjects, ["Mathematics", "Chemistry"]);
});

// #11: avatar upload wired to the same storage abstraction as materials and
// message attachments (Supabase Storage with a local-placeholder fallback) --
// the original backlog text named "Firebase Storage" specifically, which is
// stale now that the project moved to Supabase, same premise change as #41.
test("#11: avatar upload rejects a disallowed type/oversized image, and an accepted one persists", async () => {
  const token = await login("student@smarttutor.local");

  const badType = await request(app)
    .post("/api/auth/me/avatar")
    .set("Authorization", `Bearer ${token}`)
    .attach("avatar", Buffer.from("not an image"), { filename: "profile.gif", contentType: "image/gif" })
    .expect(400);
  assert.match(badType.body.message, /PNG, JPEG, and WebP/);

  const tooBig = await request(app)
    .post("/api/auth/me/avatar")
    .set("Authorization", `Bearer ${token}`)
    .attach("avatar", Buffer.alloc(3 * 1024 * 1024, 1), { filename: "big.png", contentType: "image/png" })
    .expect(400);
  assert.match(tooBig.body.message, /2MB/);

  const accepted = await request(app)
    .post("/api/auth/me/avatar")
    .set("Authorization", `Bearer ${token}`)
    .attach("avatar", Buffer.from("fake png bytes"), { filename: "profile.png", contentType: "image/png" })
    .expect(201);
  assert.ok(accepted.body.user.avatarUrl, "an accepted upload must set a real avatarUrl");

  const reloaded = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(reloaded.body.user.avatarUrl, accepted.body.user.avatarUrl, "avatarUrl must persist across a fresh reload");
});
