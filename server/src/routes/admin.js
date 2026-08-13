import { Router } from "express";
import { z } from "zod";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { badRequest, notFound } from "../utils/errors.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, permit("admin"));

adminRouter.get("/stats", (_req, res) => {
  const activeTutors = store.users.filter((user) => user.role === "tutor" && user.active).length;
  const revenue = store.transactions
    .filter((transaction) => transaction.status === "paid")
    .reduce((total, transaction) => total + transaction.amount, 0);

  res.json({
    totalUsers: store.users.length,
    activeTutors,
    sessions: store.bookings.length,
    platformRevenue: revenue
  });
});

adminRouter.get("/users", (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 10)));
  const role = req.query.role;
  const status = req.query.status;

  let rows = store.users.map((user) => store.userPublic(user));
  if (role && role !== "all") rows = rows.filter((user) => user.role === role);
  if (status && status !== "all") rows = rows.filter((user) => (status === "active" ? user.active : !user.active));

  res.json({
    total: rows.length,
    page,
    pageSize,
    users: rows.slice((page - 1) * pageSize, page * pageSize)
  });
});

adminRouter.patch("/users/:id", (req, res, next) => {
  try {
    const payload = z
      .object({
        role: z.enum(["student", "tutor", "admin"]).optional(),
        active: z.boolean().optional()
      })
      .parse(req.body);
    const user = store.findUser(req.params.id);
    if (!user) throw notFound("User not found");
    // An admin editing their own role/active status can lock every admin out
    // of the panel with one request -- there is no recovery path in this app.
    if (user.id === req.user.id && ((payload.role && payload.role !== user.role) || payload.active === false)) {
      throw badRequest("You cannot change your own role or disable your own account");
    }
    if (payload.role) user.role = payload.role;
    if (payload.active !== undefined) user.active = payload.active;
    res.json({ user: store.userPublic(user) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/transactions", (_req, res) => {
  res.json({ transactions: store.transactions.map((transaction) => store.shapeTransaction(transaction)) });
});

adminRouter.get("/reports", (_req, res) => {
  const flagged = store.messages
    .filter((message) => message.flagged)
    .map((message) => ({
      ...message,
      sender: store.userPublic(store.findUser(message.senderId)),
      conversation: store.conversations.find((conversation) => conversation.id === message.conversationId)
    }));
  res.json({ reports: flagged });
});
