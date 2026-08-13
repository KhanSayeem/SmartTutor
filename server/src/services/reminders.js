import { store } from "../data/store.js";
import { sendMail } from "./mailer.js";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
// Checked far more often than the 24h window itself so "roughly 24 hours
// before" holds without a real cron process -- this is a single long-lived
// Express server, not a worker queue.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function sessionStartsAt(booking) {
  return new Date(`${booking.date}T${booking.startTime}:00`);
}

export async function sendDueReminders(now = new Date()) {
  const due = store.bookings.filter((booking) => {
    if (booking.status !== "confirmed" || booking.reminderSentAt) return false;
    const msUntilStart = sessionStartsAt(booking).getTime() - now.getTime();
    return msUntilStart > 0 && msUntilStart <= REMINDER_WINDOW_MS;
  });

  for (const booking of due) {
    const student = store.findUser(booking.studentId);
    const tutor = store.findUser(booking.tutorId);
    if (!student || !tutor) continue;
    await sendMail({
      to: student.email,
      subject: "Reminder: your SmartTutor session is coming up",
      text: `Your ${booking.subject} session with ${tutor.name} is on ${booking.date} at ${booking.startTime}. Reference ${booking.reference}.`
    });
    // Marked immediately after send, not batched, so a scheduler tick that
    // throws partway through never re-sends to bookings already handled.
    booking.reminderSentAt = new Date().toISOString();
  }

  return due.length;
}

export function startReminderScheduler() {
  const timer = setInterval(() => {
    sendDueReminders().catch((error) => console.error("[reminders] failed to send", error));
  }, CHECK_INTERVAL_MS);
  timer.unref?.();
  return timer;
}
