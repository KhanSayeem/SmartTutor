import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../data/store.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { getRealtimeContract } from "../services/realtime.js";
import { badRequest, forbidden, notFound } from "../utils/errors.js";

export const messagesRouter = Router();

// Non-numeric query values used to slide straight through Math.max/Math.min as
// NaN and silently return an empty page with a 200.
function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (value === undefined || !Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

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
      const online = store.isOnline(otherId);
      return {
        ...conversation,
        participant: { ...store.userPublic(store.findUser(otherId)), online },
        lastMessage,
        unreadCount: conversation.unreadBy.includes(req.user.id) ? 1 : 0,
        participantTyping: store.isTyping(conversation.id, otherId),
        presence: { online, updatedAt: store.presence.get(otherId)?.updatedAt || null }
      };
    });
  res.json({ conversations: rows });
});

messagesRouter.get("/conversations/:id/messages", (req, res, next) => {
  try {
    const conversation = store.conversations.find((item) => item.id === req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    // Only the newest-page fetch marks the thread read. Paging up through
    // history must not clear the unread badge mid-scroll.
    if (!req.query.before) {
      conversation.unreadBy = conversation.unreadBy.filter((id) => id !== req.user.id);
    }
    const rows = store.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Cursor paging: `before` is the id of the oldest message the client already
    // holds, so scroll-up paging stays stable while new messages arrive at the
    // other end. `page`/`pageSize` stay supported for existing callers.
    if (req.query.before || req.query.limit) {
      const limit = clampNumber(req.query.limit, 20, 1, 50);
      const cursorIndex = req.query.before ? rows.findIndex((message) => message.id === req.query.before) : rows.length;
      if (req.query.before && cursorIndex === -1) throw badRequest("Cursor message not found in this conversation");
      const start = Math.max(0, cursorIndex - limit);
      return res.json({
        messages: rows.slice(start, cursorIndex),
        hasMore: start > 0,
        total: rows.length
      });
    }

    const page = clampNumber(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = clampNumber(req.query.pageSize, 25, 1, 50);
    const end = Math.max(0, rows.length - (page - 1) * pageSize);
    const start = Math.max(0, rows.length - page * pageSize);
    res.json({ messages: rows.slice(start, end), hasMore: start > 0, total: rows.length });
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

// Deliberately tiny: the client polls this once a second so the indicator can
// appear within ~1s without putting the whole inbox on a 1s loop.
messagesRouter.get("/conversations/:id/typing", (req, res, next) => {
  try {
    const conversation = store.conversations.find((item) => item.id === req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    const otherId = conversation.participantIds.find((id) => id !== req.user.id);
    res.json({ typing: store.isTyping(conversation.id, otherId), online: store.isOnline(otherId) });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/conversations/:id/typing", (req, res, next) => {
  try {
    const conversation = store.conversations.find((item) => item.id === req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    if (!conversation.participantIds.includes(req.user.id)) throw forbidden();
    store.markTyping(conversation.id, req.user.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/messages/:id/flag", (req, res, next) => {
  try {
    const message = store.messages.find((item) => item.id === req.params.id);
    if (!message) throw notFound("Message not found");
    const conversation = store.conversations.find((item) => item.id === message.conversationId);
    if (!conversation) throw notFound("Conversation not found");
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
