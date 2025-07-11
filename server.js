// ✅ server.js
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// ✅ Serve static files if you have any (optional)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Store active rooms
const rooms = {};

// ✅ Handle new connections
io.on("connection", (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // ✅ Host creates room
  socket.on("createRoom", ({ roomCode, playerName }) => {
    if (rooms[roomCode]) {
      socket.emit("roomExists", "Room already exists. Try again.");
      return;
    }

    rooms[roomCode] = {
      host: socket,
      hostName: playerName,
      guest: null,
      currentTurn: "host", // Host starts
    };

    socket.join(roomCode);
    console.log(`✅ Room ${roomCode} created by ${playerName}`);
  });

  // ✅ Guest joins room
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];

    if (room && !room.guest) {
      room.guest = socket;
      room.guestName = playerName;

      socket.join(roomCode);

      // Send starting turn to both players
      io.to(roomCode).emit("startGame", {
        roomCode,
        hostName: room.hostName,
        guestName: room.guestName,
        currentTurn: room.currentTurn,
      });

      console.log(`✅ ${playerName} joined room ${roomCode}`);
    } else {
      socket.emit("roomFull", "Room is full or does not exist.");
      console.log(`❌ Join failed: Room ${roomCode} is full or missing`);
    }
  });

  // ✅ Relay moves & switch turns
  socket.on("moveMade", ({ roomCode, number }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // Switch turn on server
    room.currentTurn = room.currentTurn === "host" ? "guest" : "host";

    // Notify both players with the next turn info
    io.to(roomCode).emit("moveMade", {
      number,
      nextTurn: room.currentTurn,
    });
  });

  // ✅ Relay game over
  socket.on("gameOver", (roomCode) => {
    socket.to(roomCode).emit("gameOver");
  });

  // ✅ Handle rematch request
  socket.on("requestRematch", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    let opponent = null;
    if (room.host === socket) opponent = room.guest;
    else if (room.guest === socket) opponent = room.host;

    if (opponent) {
      opponent.emit("rematchRequested");
      console.log(`🔄 Rematch requested by ${socket.id} for room ${roomCode}`);
    }
  });

  // ✅ Handle rematch response
  socket.on("rematchResponse", ({ roomCode, accepted }) => {
    const room = rooms[roomCode];
    if (!room) return;

    let requester = null;
    if (room.host === socket) requester = room.guest;
    else if (room.guest === socket) requester = room.host;

    if (accepted) {
      // Pick who starts: host starts again or random
      const currentTurn = Math.random() < 0.5 ? "host" : "guest";
      io.to(roomCode).emit("startRematch", { currentTurn });
      console.log(`✅ Rematch accepted in room ${roomCode}`);
    } else {
      if (requester) requester.emit("rematchDeclined");
      console.log(`❌ Rematch declined in room ${roomCode}`);
    }
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    for (const [roomCode, room] of Object.entries(rooms)) {
      if (room.host === socket || room.guest === socket) {
        const other = room.host === socket ? room.guest : room.host;
        if (other) {
          other.emit("opponentLeft", "Opponent left the game.");
        }
        delete rooms[roomCode];
        console.log(`⚠️ Room ${roomCode} closed due to disconnect`);
      }
    }
  });
});

// ✅ Launch server
server.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
