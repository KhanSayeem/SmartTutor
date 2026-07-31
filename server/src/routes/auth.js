import bcrypt from "bcryptjs";
import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../data/store.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { sendMail } from "../services/mailer.js";
import { badRequest } from "../utils/errors.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "tutor"])
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    if (store.findUserByEmail(payload.email)) {
      throw badRequest("Email is already registered", { email: "Email is already registered" });
    }

    const user = {
      id: `u-${nanoid(8)}`,
      name: payload.name,
      email: payload.email,
      passwordHash: await bcrypt.hash(payload.password, 10),
      role: payload.role,
      active: true,
      avatar: payload.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      joinedAt: new Date().toISOString().slice(0, 10),
      subjects: payload.role === "tutor" ? ["Mathematics"] : []
    };
    store.users.push(user);
    res.status(201).json({ token: signToken(user), user: store.userPublic(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = store.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw badRequest("Invalid email or password", { credentials: "Invalid email or password" });
    }
    if (!user.active) {
      return res.status(403).json({ message: "This account has been disabled" });
    }
    res.json({ token: signToken(user), user: store.userPublic(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = store.findUserByEmail(email);
    if (user) {
      const token = nanoid(32);
      store.resetTokens = store.resetTokens.filter((entry) => entry.userId !== user.id);
      store.resetTokens.push({
        token,
        userId: user.id,
        used: false,
        expiresAt: Date.now() + 60 * 60 * 1000
      });
      const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${token}`;
      await sendMail({
        to: user.email,
        subject: "Reset your SmartTutor password",
        text: `Use this link within 1 hour: ${resetUrl}`
      });
    }
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(8) }).parse(req.body);
    const reset = store.resetTokens.find((entry) => entry.token === req.params.token);
    if (!reset || reset.used || reset.expiresAt < Date.now()) {
      throw badRequest("Reset link is invalid or expired");
    }
    const user = store.findUser(reset.userId);
    user.passwordHash = await bcrypt.hash(password, 10);
    reset.used = true;
    res.json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: store.userPublic(req.user) });
});

authRouter.patch("/me", requireAuth, (req, res) => {
  const allowed = ["name", "phone", "subjects", "bio", "qualifications", "languages", "price", "availabilitySummary"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  res.json({ user: store.userPublic(req.user) });
});
