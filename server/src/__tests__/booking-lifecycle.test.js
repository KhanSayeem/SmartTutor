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

// #28: booking creation must actually persist, flip the slot immediately,
// and hand back a real generated reference -- not a stub.
test("#28: creating a booking saves it, flips the slot immediately, and returns a real reference", async () => {
  const studentToken = await login("student@smarttutor.local");

  const before = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`).expect(200);
  const slot = before.body.slots[0];
  assert.ok(slot, "seed must provide an open slot");

  const created = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Mathematics", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode })
    .expect(201);

  assert.match(created.body.booking.reference, /^ST-\d+$/, "reference must be a real generated ST-#### value");
  assert.equal(created.body.booking.status, "pending");

  // Saved to the store: a fresh fetch by id sees it.
  const mine = await request(app).get("/api/bookings").set("Authorization", `Bearer ${studentToken}`).expect(200);
  assert.ok(mine.body.bookings.some((item) => item.id === created.body.booking.id), "the booking must actually persist, not just echo back");

  // Slot flip is immediate: the same slot no longer appears as open, with no
  // extra step required.
  const after = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`).expect(200);
  assert.ok(
    !after.body.slots.some((item) => item.date === slot.date && item.startTime === slot.startTime),
    "the booked slot must flip to unavailable immediately, not after a delay or refresh"
  );

  // Two bookings in the same run get distinct, increasing references.
  const secondSlot = after.body.slots[0];
  assert.ok(secondSlot, "seed must provide a second open slot");
  const created2 = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Physics", date: secondSlot.date, startTime: secondSlot.startTime, endTime: secondSlot.endTime, mode: secondSlot.mode })
    .expect(201);
  assert.notEqual(created2.body.booking.reference, created.body.booking.reference);
});

// #34: exactly one Transaction record per completed booking, even under a
// double-submit (e.g. a double click, or a retried request after a flaky
// network response).
test("#34: completing a booking auto-creates exactly one transaction, even if completed twice", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const before = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`).expect(200);
  const slot = before.body.slots[0];
  const booking = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Chemistry", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode })
    .expect(201);
  await request(app).patch(`/api/bookings/${booking.body.booking.id}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  await request(app).patch(`/api/bookings/${booking.body.booking.id}/complete`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  // Completing an already-completed booking again (e.g. a double click)
  // must not create a second transaction.
  await request(app).patch(`/api/bookings/${booking.body.booking.id}/complete`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  const earnings = await request(app).get("/api/progress/earnings").set("Authorization", `Bearer ${tutorToken}`).expect(200);
  const matches = earnings.body.transactions.filter((item) => item.booking?.id === booking.body.booking.id);
  assert.equal(matches.length, 1, "exactly one transaction must exist per completed booking, not one per /complete call");
  assert.equal(matches[0].amount, booking.body.booking.amount);
  assert.equal(matches[0].status, "paid");
});
