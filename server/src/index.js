import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./services/database.js";
import { sendDueReminders, startReminderScheduler } from "./services/reminders.js";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const app = createApp();

await connectDatabase();
startReminderScheduler();
sendDueReminders().catch((error) => console.error("[reminders] initial send failed", error));

app.listen(port, () => {
  console.log(`SmartTutor API running on http://localhost:${port}`);
});
