import { createServer } from "http";
import { toNodeHandler } from "better-auth/node";
import express from "express";
import cors from "cors";
import { auth } from "./lib/auth";
import dotenv from "dotenv";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import aiRouter from "./routes/ai.route";
import { initSocket } from "./lib/socket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

export const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) throw Error("Frontend URL is missing");

const httpServer = createServer(app);

// Configure CORS middleware
app.use(
  cors({
    origin: FRONTEND_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

app.all("/api/auth/*any", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/ai/chat", aiRouter);

app.get("/", (req, res) => {
  res.send("cool");
});

initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
