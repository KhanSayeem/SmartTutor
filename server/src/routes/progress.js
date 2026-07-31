import { Router } from "express";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { notFound } from "../utils/errors.js";

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.get("/student", permit("student"), (req, res) => {
  const completed = store.bookings.filter((booking) => booking.studentId === req.user.id && booking.status === "completed");
  const bySubject = completed.reduce((acc, booking) => {
    acc[booking.subject] = acc[booking.subject] || { subject: booking.subject, sessions: 0, progress: 0 };
    acc[booking.subject].sessions += 1;
    acc[booking.subject].progress = Math.min(100, acc[booking.subject].sessions * 18 + 42);
    return acc;
  }, {});
  res.json({
    stats: {
      completedSessions: completed.length,
      activeSubjects: Object.keys(bySubject).length,
      averageProgress: Object.values(bySubject).length
        ? Math.round(Object.values(bySubject).reduce((sum, item) => sum + item.progress, 0) / Object.values(bySubject).length)
        : 0
    },
    subjects: Object.values(bySubject),
    history: completed.map((booking) => store.shapeBooking(booking))
  });
});

progressRouter.get("/earnings", permit("tutor"), (req, res) => {
  const rows = store.transactions.filter((transaction) => transaction.tutorId === req.user.id);
  const monthly = rows.reduce((acc, transaction) => {
    const key = transaction.createdAt.slice(0, 7);
    acc[key] = (acc[key] || 0) + transaction.amount;
    return acc;
  }, {});
  res.json({
    stats: {
      totalEarnings: rows.reduce((sum, transaction) => sum + transaction.amount, 0),
      paidSessions: rows.length,
      averageSession: rows.length ? Math.round(rows.reduce((sum, transaction) => sum + transaction.amount, 0) / rows.length) : 0
    },
    monthly: Object.entries(monthly).map(([month, amount]) => ({ month, amount })),
    transactions: rows.map((transaction) => store.shapeTransaction(transaction))
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
