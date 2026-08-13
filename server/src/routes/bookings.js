import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { sendMail } from "../services/mailer.js";
import { forbidden, notFound } from "../utils/errors.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

function assertParticipant(user, booking) {
  if (user.role === "admin") return;
  if (![booking.studentId, booking.tutorId].includes(user.id)) throw forbidden("Booking does not belong to this account");
}

bookingsRouter.get("/", (req, res) => {
  const status = req.query.status;
  let rows = store.bookings.filter((booking) => {
    if (req.user.role === "admin") return true;
    if (req.user.role === "tutor") return booking.tutorId === req.user.id;
    return booking.studentId === req.user.id;
  });
  if (status && status !== "all") rows = rows.filter((booking) => booking.status === status);
  res.json({ bookings: rows.map((booking) => store.shapeBooking(booking)) });
});

bookingsRouter.post("/", permit("student"), async (req, res, next) => {
  try {
    const payload = z
      .object({
        tutorId: z.string(),
        subject: z.string().min(1),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        mode: z.enum(["Online", "In-Person"])
      })
      .parse(req.body);

    const tutor = store.findUser(payload.tutorId);
    if (!tutor || tutor.role !== "tutor") throw notFound("Tutor not found");

    const slot = store.availability.find(
      (item) =>
        item.tutorId === payload.tutorId &&
        item.date === payload.date &&
        item.startTime === payload.startTime &&
        !item.booked
    );
    if (!slot) {
      return res.status(409).json({ message: "That availability slot is no longer open" });
    }
    slot.booked = true;

    const booking = {
      id: `bk-${nanoid(8)}`,
      reference: store.nextReference(),
      studentId: req.user.id,
      tutorId: payload.tutorId,
      subject: payload.subject,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      mode: payload.mode,
      amount: tutor.price || 40,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    store.bookings.unshift(booking);
    await sendMail({
      to: tutor.email,
      subject: "New SmartTutor booking request",
      text: `${req.user.name} requested ${payload.subject} on ${payload.date} at ${payload.startTime}.`
    });
    res.status(201).json({ booking: store.shapeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/accept", permit("tutor"), async (req, res, next) => {
  try {
    const booking = store.bookings.find((item) => item.id === req.params.id);
    if (!booking) throw notFound("Booking not found");
    if (booking.tutorId !== req.user.id) throw forbidden("Only the assigned tutor can accept this booking");
    booking.status = "confirmed";
    const conversation = store.createConversation([booking.studentId, booking.tutorId], booking.id);
    await sendMail({
      to: store.findUser(booking.studentId).email,
      subject: "SmartTutor booking confirmed",
      text: `Your ${booking.subject} session ${booking.reference} is confirmed.`
    });
    res.json({ booking: store.shapeBooking(booking), conversationId: conversation.id });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/reject", permit("tutor"), (req, res, next) => {
  try {
    const booking = store.bookings.find((item) => item.id === req.params.id);
    if (!booking) throw notFound("Booking not found");
    if (booking.tutorId !== req.user.id) throw forbidden("Only the assigned tutor can reject this booking");
    booking.status = "cancelled";
    booking.cancellationReason = req.body.reason || "Rejected by tutor";
    const slot = store.availability.find(
      (item) => item.tutorId === booking.tutorId && item.date === booking.date && item.startTime === booking.startTime
    );
    if (slot) slot.booked = false;
    res.json({ booking: store.shapeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/cancel", (req, res, next) => {
  try {
    const booking = store.bookings.find((item) => item.id === req.params.id);
    if (!booking) throw notFound("Booking not found");
    assertParticipant(req.user, booking);
    booking.status = "cancelled";
    booking.cancellationReason = req.body.reason || "Cancelled by user";
    const slot = store.availability.find(
      (item) => item.tutorId === booking.tutorId && item.date === booking.date && item.startTime === booking.startTime
    );
    if (slot) slot.booked = false;
    res.json({ booking: store.shapeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/reschedule", (req, res, next) => {
  try {
    const booking = store.bookings.find((item) => item.id === req.params.id);
    if (!booking) throw notFound("Booking not found");
    assertParticipant(req.user, booking);
    const { date, startTime, endTime, mode } = req.body;
    const nextSlot = store.availability.find(
      (item) => item.tutorId === booking.tutorId && item.date === date && item.startTime === startTime && !item.booked
    );
    if (!nextSlot) return res.status(409).json({ message: "Requested slot is already booked" });
    const previousSlot = store.availability.find(
      (item) => item.tutorId === booking.tutorId && item.date === booking.date && item.startTime === booking.startTime
    );
    if (previousSlot) previousSlot.booked = false;
    nextSlot.booked = true;
    Object.assign(booking, { date, startTime, endTime, mode: mode || booking.mode, status: "pending" });
    res.json({ booking: store.shapeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/complete", permit("tutor", "admin"), (req, res, next) => {
  try {
    const booking = store.bookings.find((item) => item.id === req.params.id);
    if (!booking) throw notFound("Booking not found");
    if (req.user.role === "tutor" && booking.tutorId !== req.user.id) throw forbidden();
    booking.status = "completed";
    booking.notes = req.body.notes || booking.notes;
    const exists = store.transactions.some((transaction) => transaction.bookingId === booking.id);
    if (!exists) {
      store.transactions.unshift({
        id: `txn-${nanoid(8)}`,
        bookingId: booking.id,
        studentId: booking.studentId,
        tutorId: booking.tutorId,
        subject: booking.subject,
        amount: booking.amount,
        status: "paid",
        createdAt: new Date().toISOString()
      });
    }
    res.json({ booking: store.shapeBooking(booking) });
  } catch (error) {
    next(error);
  }
});
