import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("create-room", ({ username }) => {
    const roomId = uuidv4();
    rooms[roomId] = {
      players: [{ id: socket.id, username, score: 0 }],
      drawerIndex: 0,
    };
    socket.join(roomId);
    socket.emit("room-created", { roomId });
  });

  socket.on("join-room", ({ roomId, username }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].players.push({ id: socket.id, username, score: 0 });
    socket.join(roomId);
    io.to(roomId).emit("player-joined", rooms[roomId].players);
  });

  socket.on("drawing", ({ roomId, data }) => {
    socket.to(roomId).emit("drawing", data);
  });

  socket.on("chat-message", ({ roomId, message, username }) => {
    io.to(roomId).emit("chat-message", { message, username });
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (rooms[roomId]) {
        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
        io.to(roomId).emit("player-joined", rooms[roomId].players);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});