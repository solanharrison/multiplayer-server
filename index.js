const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let players = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  players[socket.id] = {
    x: Math.random() * 700,
    y: Math.random() * 500,
    hp: 100,
    kills: 0,
  };

  socket.emit("init", { id: socket.id, players });
  socket.broadcast.emit("player-joined", { id: socket.id, player: players[socket.id] });

  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit("state", players);
    }
  });

  socket.on("hit", (targetId) => {
    if (players[targetId]) {
      players[targetId].hp -= 10;
      if (players[targetId].hp <= 0) {
        players[socket.id].kills += 1;
        players[targetId].hp = 100;
        players[targetId].x = Math.random() * 700;
        players[targetId].y = Math.random() * 500;
      }
      io.emit("state", players);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("player-left", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
