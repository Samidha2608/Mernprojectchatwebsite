import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import 'dotenv/config';

// import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.routes.js"
import messageRoutes from "./routes/message.routes.js";
import groupsRoutes from "./routes/group.routes.js"
import { app, server } from "./lib/socket.js";
// import { app, server } from "./lib/socket.js";

// const __dirname = path.resolve();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin:process.env.Frontend_URI,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupsRoutes);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

server.listen(process.env.PORT, () => {
  console.log("server is running on PORT:" + process.env.PORT);
  connectDB();
});

// https://github.com/burakorkmez/fullstack-chat-app/blob/master/backend/src/seeds/user.seed.js