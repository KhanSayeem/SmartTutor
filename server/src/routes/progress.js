import { Router } from "express";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { notFound } from "../utils/errors.js";

export const progressRouter = Router();

progressRouter.use(requireAuth);

// A mastery target is a heuristic, not a curriculum model: there is no lesson
// plan in this app, so "percent progress" is defined as how far a subject's
// completed-session count is toward this target, capped at 100%.
const MASTERY_SESSIONS_TARGET = 6;

progressRouter.get("/student", permit("student"), (req, res) => {
  const own = store.bookings.filter((booking) => booking.studentId === req.user.id);
  const completed = own.filter((booking) => booking.status === "completed");

  const bySubject = completed.reduce((acc, booking) => {
    acc[booking.subject] = acc[booking.subject] || { subject: booking.subject, sessions: 0 };
    acc[booking.subject].sessions += 1;
    return acc;
  }, {});
  const subjects = Object.values(bySubject).map((row) => ({
    ...row,
    progress: Math.min(100, Math.round((row.sessions / MASTERY_SESSIONS_TARGET) * 100))
  }));

  const studentReviews = store.reviews.filter((review) => review.studentId === req.user.id);
  const completedReviews = studentReviews.filter((review) => {
    const booking = store.bookings.find((item) => item.id === review.bookingId);
    return booking && booking.status === "completed";
  });
  const averageRating = completedReviews.length
    ? Math.round((completedReviews.reduce((sum, review) => sum + review.rating, 0) / completedReviews.length) * 10) / 10
    : null;

  const history = completed
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((booking) => {
      const review = studentReviews.find((item) => item.bookingId === booking.id);
      return {
        id: booking.id,
        date: booking.date,
        subject: booking.subject,
        tutor: store.userPublic(store.findUser(booking.tutorId)),
        notes: booking.notes || null,
        rating: review ? review.rating : null
      };
    });

  res.json({
    stats: {
      sessionsTotal: own.length,
      completedSessions: completed.length,
      activeSubjects: subjects.length,
      averageRating
    },
    subjects,
    history
  });
});

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

progressRouter.get("/earnings", permit("tutor"), (req, res) => {
  const rows = store.transactions.filter((transaction) => transaction.tutorId === req.user.id);
  const totalEarnings = rows.reduce((sum, transaction) => sum + transaction.amount, 0);

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = rows
    .filter((transaction) => transaction.createdAt.slice(0, 7) === thisMonthKey)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // There is no pending-transaction concept in this schema -- a transaction is
  // only ever created already "paid", when a booking completes. Pending payout
  // is instead the amount tied up in this tutor's accepted-but-not-yet-completed
  // bookings, which is a real number even though it isn't a Transaction row.
  const pendingPayout = store.bookings
    .filter((booking) => booking.tutorId === req.user.id && booking.status === "confirmed")
    .reduce((sum, booking) => sum + (booking.amount || 0), 0);

  const monthly = rows.reduce((acc, transaction) => {
    const key = transaction.createdAt.slice(0, 7);
    acc[key] = (acc[key] || 0) + transaction.amount;
    return acc;
  }, {});
  const monthlySeries = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, amount]) => ({ key, month: MONTH_LABELS[Number(key.slice(5, 7)) - 1], amount }));

  res.json({
    stats: {
      thisMonth,
      allTime: totalEarnings,
      pendingPayout,
      sessions: rows.length
    },
    monthly: monthlySeries,
    transactions: rows
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((transaction) => store.shapeTransaction(transaction))
  });
});

progressRouter.get("/invoices", permit("student"), (req, res) => {
  const rows = store.transactions
    .filter((transaction) => transaction.studentId === req.user.id)
    .map((transaction) => store.shapeTransaction(transaction));
  res.json({
    total: rows.reduce((sum, transaction) => sum + transaction.amount, 0),
    invoices: rows
  });
});

progressRouter.get("/invoices/:id/download", permit("student"), (req, res, next) => {
  try {
    const transaction = store.transactions.find((item) => item.id === req.params.id && item.studentId === req.user.id);
    if (!transaction) throw notFound("Invoice not found");
    const row = store.shapeTransaction(transaction);
    const csv = [
      "invoice,tutor,subject,date,amount,status",
      `${row.id},${row.tutor.name},${row.subject},${row.createdAt.slice(0, 10)},${row.amount},${row.status}`
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${row.id}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
