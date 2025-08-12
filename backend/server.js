import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";

import userRouter from "./routes/userRouter.js";
import messageRouter from "./routes/messageRouter.js";
import chatroomRouter from "./routes/chatroomRouter.js";
import uploadRouter from "./routes/uploadRouter.js";
import { connectDB } from "./db.js";
import Chatroom from "./models/chatroomSchema.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

const store = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
});

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.set("trust proxy", 1); // wichtig für secure Cookies hinter DO/HTTPS
}

const sessionMiddleware = session({
  name: "connect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    httpOnly: true,
  },
  store,
});

app.use(sessionMiddleware);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    // allowedHeaders: ["cors-header"],
    credentials: true,
  },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on("connection", async (socket) => {
  const session = socket.request.session;

  if (!session || !session.user || !session.user.id) {
    console.log("Invalid or missing session");
    socket.disconnect(true);
    return;
  }

  const userId = session.user.id;

  try {
    const allChats = await Chatroom.find({ users: userId });
    const chatroomIds = allChats.map((chat) => chat._id.toString());

    chatroomIds.forEach((id) => socket.join(id));
    socket.join(userId);

    console.log(`✅ Client connected: ${socket.id}, UserID: ${userId}`);
  } catch (error) {
    console.error("Error loading chats:", error);
    socket.disconnect(true);
  }

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

app.use("/api/users", userRouter(io));
app.use("/api/messages", messageRouter(io));
app.use("/api/chatrooms", chatroomRouter(io));
app.use("/api/upload", uploadRouter);

const baseUrl = process.env.BASE_URL || "http://localhost";
const port = parseInt(process.env.PORT) || 8080;
httpServer.listen(port, () => console.log(`PORT ON: ${baseUrl}:${port}`));
