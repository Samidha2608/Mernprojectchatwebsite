import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.Frontend_URI,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000, // Adjust ping interval
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}
const userGroupsMap = {}; // {userId: [groupId1, groupId2, ...]}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Make this user join their own room for direct messages
    socket.join(userId);
  }

   // Join all group rooms the user is part of
   if (socket.handshake.query.groups) {
    try {
      const groups = JSON.parse(socket.handshake.query.groups);
      if (Array.isArray(groups)) {
        userGroupsMap[userId] = groups;
        groups.forEach(groupId => {
          socket.join(`group:${groupId}`);
          console.log(`User ${userId} joined group:${groupId} on connect`);
        });
      }
    } catch (error) {
      console.error("Error parsing groups:", err);
    }
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle joining a new group
  socket.on("joinGroup", (groupId) => {
    socket.join(`group:${groupId}`);
    console.log(`User ${userId} joined group:${groupId}`);

     // Update user's groups map
     if (!userGroupsMap[userId]) {
      userGroupsMap[userId] = [];
    }
    if (!userGroupsMap[userId].includes(groupId)) {
      userGroupsMap[userId].push(groupId);
    }
  });

   // Handle leaving a group
   socket.on("leaveGroup", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${userId} left group:${groupId}`);

    // Update user's groups map
    if (userGroupsMap[userId]) {
      userGroupsMap[userId] = userGroupsMap[userId].filter(id => id !== groupId);
    }
  });

   // Handle reconnection - rejoin all groups
   socket.on("rejoinGroups", () => {
    if (userId && userGroupsMap[userId]) {
      userGroupsMap[userId].forEach(groupId => {
        socket.join(`group:${groupId}`);
        console.log(`User ${userId} rejoined group:${groupId}`);
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Expose a function to emit group messages to all members
export function emitGroupMessage(groupId, message) {
  io.to(`group:${groupId}`).emit("newGroupMessage", message);
}

export { io, app, server };