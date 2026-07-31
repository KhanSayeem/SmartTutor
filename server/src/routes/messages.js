import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { getRealtimeContract } from "../services/realtime.js";
import { forbidden, notFound } from "../utils/errors.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get("/contract", (_req, res) => {
  res.json(getRealtimeContract());
});

messagesRouter.get("/conversations", (req, res) => {
  const rows = store.conversations
    .filter((conversation) => conversation.participantIds.includes(req.user.id))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== req.user.id);
      const lastMessage = [...store.messages].reverse().find((message) => message.conversationId === conversation.id);
      return {
        ...conversation,
        participant: store.userPublic(store.findUser(otherId)),
        lastMessage,
        unreadCount: conversation.unreadBy.includes(req.user.id) ? 1 : 0,
        presence: store.presence.get(otherId) || { online: false }
      };
    });
  res.json({ conversations: rows });
});

messagesRouter.get("/conversations/:id/messages", (req, res, next) => {
  try {
    const conversation = store.conversations.find((item) => item.id === req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    conversation.unreadBy = conversation.unreadBy.filter((id) => id !== req.user.id);
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(10, Number(req.query.pageSize || 25)));
    const rows = store.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({
      messages: rows.slice(Math.max(0, rows.length - page * pageSize), rows.length - (page - 1) * pageSize),
      total: rows.length
    });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/conversations/:id/messages", (req, res, next) => {
  try {
    const conversation = store.conversations.find((item) => item.id === req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    const payload = z
      .object({
        body: z.string().min(1),
        attachments: z.array(z.object({ title: z.string(), url: z.string() })).default([])
      })
      .parse(req.body);
    const message = {
      id: `msg-${nanoid(8)}`,
      conversationId: conversation.id,
      senderId: req.user.id,
      body: payload.body,
      attachments: payload.attachments,
      flagged: false,
      createdAt: new Date().toISOString()
    };
    store.messages.push(message);
    conversation.updatedAt = message.createdAt;
    conversation.unreadBy = conversation.participantIds.filter((id) => id !== req.user.id);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/messages/:id/flag", (req, res, next) => {
  try {
    const message = store.messages.find((item) => item.id === req.params.id);
    if (!message) throw notFound("Message not found");
    const conversation = store.conversations.find((item) => item.id === message.conversationId);
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    message.flagged = true;
    message.flagReason = req.body.reason || "Reported by user";
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

messagesRouter.get("/flagged", permit("admin"), (req, res) => {
  res.json({ reports: store.messages.filter((message) => message.flagged) });
});
