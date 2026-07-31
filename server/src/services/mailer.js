import nodemailer from "nodemailer";

export async function sendMail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[dev-mail] ${subject} -> ${to}\n${text}`);
    return { preview: "console" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

  return transporter.sendMail({
    to,
    from: process.env.MAIL_FROM || "SmartTutor <noreply@smarttutor.local>",
    subject,
    text
  });
}
