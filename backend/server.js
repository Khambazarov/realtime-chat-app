import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import cookie from "cookie";

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
    origin: "https://chat.khambazarov.dev",
    credentials: true,
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // origin: [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN2],
    origin: "https://chat.khambazarov.dev",
    allowedHeaders: ["cors-header"],
    credentials: true,
  },
});

const store = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
});

io.on("connection", async (socket) => {
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  const sessionId = cookie.parse(socket.handshake.headers.cookie ?? "")[
    "connect.sid"
  ];

  if (sessionId === undefined) {
    socket.disconnect(true);
    return;
  }

  const session = await new Promise((resolve, reject) => {
    store.get(sessionId.split(".")[0].slice(2), (err, session) => {
      if (err) {
        reject(err);
      } else {
        resolve(session);
      }
    });
  });

  if (!session || !session.user) {
    socket.disconnect(true);
    return;
  }

  const userId = session.user.id;

  const allChats = await Chatroom.find({ users: userId });

  const chatroomIds = allChats.map((chat) => chat._id.toString());

  chatroomIds.forEach((id) => socket.join(id));
  socket.join(userId);

  console.log(`Client connected: ${socket.id}`);
});

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    // saveUninitialized: true,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "None",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    },
    store,
  })
);

app.use("/api/users", userRouter(io));
app.use("/api/messages", messageRouter(io));
app.use("/api/chatrooms", chatroomRouter(io));
app.use("/api/upload", uploadRouter);

const baseUrl = process.env.BASE_URL;
const port = parseInt(process.env.PORT) || 8080;
httpServer.listen(port, () => console.log(`PORT ON: ${baseUrl}:${port}`));
