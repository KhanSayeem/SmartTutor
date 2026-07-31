import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./services/database.js";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const app = createApp();

await connectDatabase();

app.listen(port, () => {
  console.log(`SmartTutor API running on http://localhost:${port}`);
});
