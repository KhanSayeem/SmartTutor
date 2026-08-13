import request from "supertest";
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// node --test runs each file in its own process, so the in-memory store here
// starts from the seed fixtures fresh -- these tests don't see mutations made
// by other test files, only the ones they make themselves within this file.
const app = createApp();

async function login(email) {
  const response = await request(app).post("/api/auth/login").send({ email, password: "Password123!" });
  return response.body.token;
}

test("accepting a booking creates a conversation and returns its id", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  // bk-1001 is seeded pending, u-student <-> u-tutor, with no existing thread.
  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);

  assert.ok(accept.body.conversationId, "accept response should include conversationId");

  const inbox = await request(app)
    .get("/api/messages/conversations")
    .set("Authorization", `Bearer ${studentToken}`)
    .expect(200);
  const conversation = inbox.body.conversations.find((item) => item.id === accept.body.conversationId);
  assert.ok(conversation, "the new conversation should appear in the student's inbox");
  assert.equal(conversation.bookingId, "bk-1001");
  assert.equal(conversation.participant.id, "u-tutor");
});

test("regression: accepting a second booking between the same pair does not reuse the first booking's thread", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  // bk-1000 is seeded confirmed with an existing thread (conv-1, bound to
  // bk-1000). Book and accept a brand-new session for the same pair -- it
  // must get its own thread, not conv-1. This is the exact bug fixed in
  // commit 28505e1: the old matching rule OR'd bookingId equality with "any
  // thread containing both people", so a second booking between the same
  // pair silently inherited the first one's thread.
  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  const openSlot = availability.body.slots[0];
  assert.ok(openSlot, "seed must provide an open slot for this regression check");

  const booked = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Mathematics", date: openSlot.date, startTime: openSlot.startTime, endTime: openSlot.endTime, mode: openSlot.mode })
    .expect(201);

  const accept = await request(app)
    .patch(`/api/bookings/${booked.body.booking.id}/accept`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);

  assert.notEqual(accept.body.conversationId, "conv-1");
  assert.equal(accept.body.booking.status, "confirmed");
});

test("rejecting a never-accepted booking creates no conversation", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  const openSlot = availability.body.slots[0];
  assert.ok(openSlot, "seed must provide an open slot for this check");

  const booked = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Mathematics", date: openSlot.date, startTime: openSlot.startTime, endTime: openSlot.endTime, mode: openSlot.mode })
    .expect(201);

  const before = await request(app).get("/api/messages/conversations").set("Authorization", `Bearer ${studentToken}`);
  const countBefore = before.body.conversations.length;

  const rejected = await request(app)
    .patch(`/api/bookings/${booked.body.booking.id}/reject`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({ reason: "Schedule conflict" })
    .expect(200);
  assert.equal(rejected.body.booking.status, "cancelled");

  const after = await request(app).get("/api/messages/conversations").set("Authorization", `Bearer ${studentToken}`);
  assert.equal(after.body.conversations.length, countBefore, "rejecting should not create a thread");
});

test("distinct student/tutor pairs get distinct threads, and cannot see each other's", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const liamToken = await login("liam@smarttutor.local");
  const priyaToken = await login("priya@smarttutor.local");

  // Book fresh pending sessions for two different students with the same
  // tutor, accept both, and prove each got its own thread.
  const openSlots = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${liamToken}`);
  const [slotA, slotB] = openSlots.body.slots;
  assert.ok(slotA && slotB, "seed must provide at least two open slots for this tutor");

  const bookingA = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${liamToken}`)
    .send({ tutorId: "u-tutor", subject: "Physics", date: slotA.date, startTime: slotA.startTime, endTime: slotA.endTime, mode: slotA.mode })
    .expect(201);
  const bookingB = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${priyaToken}`)
    .send({ tutorId: "u-tutor", subject: "Chemistry", date: slotB.date, startTime: slotB.startTime, endTime: slotB.endTime, mode: slotB.mode })
    .expect(201);

  const acceptA = await request(app).patch(`/api/bookings/${bookingA.body.booking.id}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  const acceptB = await request(app).patch(`/api/bookings/${bookingB.body.booking.id}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  assert.notEqual(acceptA.body.conversationId, acceptB.body.conversationId);

  // Liam cannot read Priya's thread with the tutor.
  await request(app)
    .get(`/api/messages/conversations/${acceptB.body.conversationId}/messages`)
    .set("Authorization", `Bearer ${liamToken}`)
    .expect(403);

  // Liam's own inbox does not contain Priya's thread.
  const liamInbox = await request(app).get("/api/messages/conversations").set("Authorization", `Bearer ${liamToken}`).expect(200);
  assert.ok(!liamInbox.body.conversations.some((item) => item.id === acceptB.body.conversationId));
});

// #36: confirm the booking-to-message handoff works end to end, not just
// that a conversation row gets created.
test("booking-to-message handoff: accept creates a thread that both sides can actually message in", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const accept = await request(app)
    .patch("/api/bookings/bk-1001/accept")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({})
    .expect(200);
  const conversationId = accept.body.conversationId;

  const sent = await request(app)
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${tutorToken}`)
    .send({ body: "Looking forward to our session!" })
    .expect(201);
  assert.equal(sent.body.message.senderId, "u-tutor");

  // Checked before the student ever opens the thread -- GET .../messages
  // marks it read as a side effect, so this must come first or the
  // assertion below would trivially always see 0.
  const studentInbox = await request(app).get("/api/messages/conversations").set("Authorization", `Bearer ${studentToken}`).expect(200);
  const thread = studentInbox.body.conversations.find((item) => item.id === conversationId);
  assert.equal(thread.unreadCount, 1, "the tutor's message should mark the thread unread for the student");

  const studentView = await request(app)
    .get(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${studentToken}`)
    .expect(200);
  assert.ok(studentView.body.messages.some((message) => message.body === "Looking forward to our session!"));

  const reply = await request(app)
    .post(`/api/messages/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ body: "Me too, see you then." })
    .expect(201);
  assert.equal(reply.body.message.senderId, "u-student");
});

test("reschedule keeps the same conversation instead of creating a duplicate", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const accept = await request(app).patch("/api/bookings/bk-1001/accept").set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  const firstConversationId = accept.body.conversationId;

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  const openSlot = availability.body.slots[0];
  assert.ok(openSlot, "seed must provide an open slot to reschedule into");

  await request(app)
    .patch("/api/bookings/bk-1001/reschedule")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ date: openSlot.date, startTime: openSlot.startTime, endTime: openSlot.endTime, mode: openSlot.mode })
    .expect(200);

  const reaccept = await request(app).patch("/api/bookings/bk-1001/accept").set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  assert.equal(reaccept.body.conversationId, firstConversationId, "re-accepting the same booking should return the same thread");
});
