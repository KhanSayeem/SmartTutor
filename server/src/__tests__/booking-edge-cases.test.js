import request from "supertest";
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// #37: edge cases for the full booking flow -- double-booking attempt,
// cancel after confirm, reschedule conflict. Each test file runs in its
// own process, so the in-memory store starts from the seed fixtures fresh.
const app = createApp();

async function login(email) {
  const response = await request(app).post("/api/auth/login").send({ email, password: "Password123!" });
  return response.body.token;
}

test("double-booking: a second student cannot book a slot the first student already took", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const liamToken = await login("liam@smarttutor.local");
  const priyaToken = await login("priya@smarttutor.local");

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${tutorToken}`);
  const slot = availability.body.slots[0];
  assert.ok(slot, "seed must provide an open slot for this check");

  const before = await request(app).get("/api/bookings").set("Authorization", `Bearer ${tutorToken}`).expect(200);
  const countBefore = before.body.bookings.filter((b) => b.date === slot.date && b.startTime === slot.startTime).length;

  const first = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${liamToken}`)
    .send({ tutorId: "u-tutor", subject: "Physics", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode })
    .expect(201);
  assert.equal(first.body.booking.status, "pending");

  const second = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${priyaToken}`)
    .send({ tutorId: "u-tutor", subject: "Physics", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode });
  assert.equal(second.status, 409, "the slot should no longer be available to a second student");

  const tutorBookings = await request(app).get("/api/bookings").set("Authorization", `Bearer ${tutorToken}`).expect(200);
  const matching = tutorBookings.body.bookings.filter((b) => b.date === slot.date && b.startTime === slot.startTime);
  assert.equal(matching.length, countBefore + 1, "exactly one new booking should exist for the contested slot -- the rejected second attempt must not have created a row");
  assert.ok(matching.some((b) => b.id === first.body.booking.id), "the successful first booking must be among the matches");
  assert.ok(!matching.some((b) => b.student?.id === "u-student-3"), "Priya's rejected attempt must not have created a booking");
});

test("cancel after confirm: a confirmed booking can be cancelled by the student and its slot reopens", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  const slot = availability.body.slots[0];
  assert.ok(slot, "seed must provide an open slot for this check");

  const booked = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Mathematics", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode })
    .expect(201);
  const bookingId = booked.body.booking.id;

  await request(app).patch(`/api/bookings/${bookingId}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  const cancelled = await request(app)
    .patch(`/api/bookings/${bookingId}/cancel`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ reason: "Change of plans" })
    .expect(200);
  assert.equal(cancelled.body.booking.status, "cancelled");

  const availabilityAfter = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  assert.ok(
    availabilityAfter.body.slots.some((item) => item.date === slot.date && item.startTime === slot.startTime),
    "the slot should be open again after cancelling a confirmed booking"
  );
});

test("cancel after complete: a completed (already paid) session cannot be cancelled", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const studentToken = await login("student@smarttutor.local");

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${studentToken}`);
  const slot = availability.body.slots[0];
  assert.ok(slot, "seed must provide an open slot for this check");

  const booked = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ tutorId: "u-tutor", subject: "Mathematics", date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: slot.mode })
    .expect(201);
  const bookingId = booked.body.booking.id;

  await request(app).patch(`/api/bookings/${bookingId}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  await request(app).patch(`/api/bookings/${bookingId}/complete`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  const cancelAttempt = await request(app)
    .patch(`/api/bookings/${bookingId}/cancel`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ reason: "Trying to undo a completed session" });
  assert.equal(cancelAttempt.status, 400, "a completed session should not be cancellable");

  const stillCompleted = await request(app).get("/api/bookings").set("Authorization", `Bearer ${studentToken}`).expect(200);
  const booking = stillCompleted.body.bookings.find((b) => b.id === bookingId);
  assert.equal(booking.status, "completed", "status must not have changed");
});

test("reschedule conflict: rescheduling into a slot another booking already holds is rejected", async () => {
  const tutorToken = await login("tutor@smarttutor.local");
  const liamToken = await login("liam@smarttutor.local");
  const priyaToken = await login("priya@smarttutor.local");

  const availability = await request(app).get("/api/tutors/u-tutor/availability").set("Authorization", `Bearer ${tutorToken}`);
  const [slotA, slotB] = availability.body.slots;
  assert.ok(slotA && slotB, "seed must provide at least two open slots for this check");

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
  await request(app).patch(`/api/bookings/${bookingA.body.booking.id}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);
  await request(app).patch(`/api/bookings/${bookingB.body.booking.id}/accept`).set("Authorization", `Bearer ${tutorToken}`).send({}).expect(200);

  const conflictAttempt = await request(app)
    .patch(`/api/bookings/${bookingA.body.booking.id}/reschedule`)
    .set("Authorization", `Bearer ${liamToken}`)
    .send({ date: slotB.date, startTime: slotB.startTime, endTime: slotB.endTime, mode: slotB.mode });
  assert.equal(conflictAttempt.status, 409, "rescheduling into an already-booked slot should be rejected");

  const unchanged = await request(app).get("/api/bookings").set("Authorization", `Bearer ${liamToken}`).expect(200);
  const booking = unchanged.body.bookings.find((b) => b.id === bookingA.body.booking.id);
  assert.equal(booking.date, slotA.date, "booking A must keep its original date after a failed reschedule");
  assert.equal(booking.startTime, slotA.startTime, "booking A must keep its original time after a failed reschedule");
  assert.equal(booking.status, "confirmed", "booking A must remain confirmed, not reset to pending, after a failed reschedule");
});
