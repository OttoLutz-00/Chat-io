const { pickRandomPublicRoom, generateCode, findPlayerAndRoomIndex, cleanRoom, getBrowseRoomData, findPlayerById } = require("./utils");
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const cors = require('cors');
const corsOptions = { origin: 'http://localhost:3000' };
const profanity = require('profanity');
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ['http://localhost:3000']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 5000, // 5 seconds
  pingInterval: 10000 // 10 seconds
});
app.use(cors(corsOptions));

const rooms = [];

// --SERVER ENDPOINTS--
app.get('/api/player-count', (req, res) => {
  console.log("GET /api/player-count");
  console.log("socket rooms: ", io.sockets.adapter.rooms.size);
  console.log("rooms length: ", rooms.length);
  const roomCount = io.sockets.adapter.rooms.size - rooms.length;
  res.json({ count: roomCount });
});

app.get('/api/find-room', (req, res) => {
  console.log("GET /api/find-room");
  const roomCode = pickRandomPublicRoom(rooms);
  if (roomCode === null) {
    const newRoomCode = generateCode();
    rooms.push({
      host: {},
      code: newRoomCode,
      private: false,
      profane: false,
      maxPlayerCount: 4,
      playerCount: 0,
      players: []
    })
    res.json({ code: newRoomCode });
  } else {
    res.json({ code: roomCode })
  }
});

app.get('/api/check-room', (req, res) => {
  console.log("GET /api/check-room");
  const code = req.query.code;
  let roomIndex = rooms.findIndex(room => { return room.code === code });
  if (roomIndex > -1) { // if room exists
    if (rooms[roomIndex].playerCount < rooms[roomIndex].maxPlayerCount) { // if room has space for another player
      res.json({ isJoinable: true, reason: null })
    } else { // room is full
      res.json({ isJoinable: false, reason: "room-is-full" })
    }
  } else { // room doesnt exist
    res.json({ isJoinable: false, reason: "room-not-found" })
  }
});

app.get('/api/create-room', (req, res) => {
  console.log("GET /api/create-room");
  console.log(req.query);
  const private = req.query.private === "true" ? true : false;
  const profane = req.query.profane === "true" ? true : false;
  const count = parseInt(req.query.maxPlayerCount);
  console.log("profane? ", profane);
  const newRoomCode = generateCode();
  rooms.push({
    host: null,
    code: newRoomCode,
    private: private,
    profane: profane,
    maxPlayerCount: count,
    playerCount: 0,
    players: []
  })
  console.log("created room:", newRoomCode);
  res.json({ code: newRoomCode });
});

app.get('/api/get-rooms', (req, res) => {
  console.log("GET /api/get-rooms");
  const allRooms = getBrowseRoomData(rooms);
  res.json({ rooms: allRooms });
});
// --SERVER ENDPOINTS--



// --SOCKET LOGIC--
io.on("connection", socket => {
  console.log("--user connected--");

  socket.on("join-room", (roomCode, userId, username) => {
    let roomIndex = rooms.findIndex(room => { return room.code === roomCode });
    if (roomIndex > -1) {
      if (rooms[roomIndex].playerCount < rooms[roomIndex].maxPlayerCount) {
        rooms[roomIndex].playerCount++;
        rooms[roomIndex].players.push({ id: userId, socketId: socket.id, username: username });
        if (rooms[roomIndex].playerCount === 1) {
          rooms[roomIndex].host = { id: userId, socketId: socket.id, username, username }; // if you are the host
        }
        socket.join(roomCode);
        console.log(`${username} joined room ${roomCode}`);
        const roomData = cleanRoom(rooms[roomIndex]);
        socket.emit("receive-room-data", roomData);
        socket.to(rooms[roomIndex].code).emit("player-joined", username, roomData)
      } else {
        console.log("room is full");
        socket.emit("room-is-full");
      }
    } else {
      console.log("room not found");
      socket.emit("room-not-found");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("REASON FOR DC: ", reason);
    console.log("*user disconnected*");
    const { playerIndex, roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (playerIndex > -1 && roomIndex > -1) {
      io.to(rooms[roomIndex].code).emit("typing-stop", rooms[roomIndex].players[playerIndex].id);
      socket.leave(rooms[roomIndex].code);
      const username = rooms[roomIndex].players[playerIndex].username;
      if (rooms[roomIndex].playerCount - 1 <= 0) { // if room is now empty, and should be deleted
        console.log(`${username} just left room ${rooms[roomIndex].code}`);
        console.log(`deleting room ${rooms[roomIndex].code}`);
        rooms.splice(roomIndex, 1);
      } else { // if room still has other players playing
        rooms[roomIndex].playerCount--;
        console.log(`${username} just left room ${rooms[roomIndex].code}`);
        if (rooms[roomIndex].host.id === rooms[roomIndex].players[playerIndex].id && socket.id === rooms[roomIndex].host.socketId) { // if user was the host, make someone else the host
          rooms[roomIndex].players.splice(playerIndex, 1);
          console.log("assigning new host");
          rooms[roomIndex].host = {
            id: rooms[roomIndex].players[0].id,
            socketId: rooms[roomIndex].players[0].socketId,
            username: rooms[roomIndex].players[0].username
          }
        } else {
          rooms[roomIndex].players.splice(playerIndex, 1);
        }
        if (reason === "server namespace disconnect") {
          io.to(rooms[roomIndex].code).emit("player-kicked", username, cleanRoom(rooms[roomIndex]));
        } else {
          io.to(rooms[roomIndex].code).emit("player-left", username, cleanRoom(rooms[roomIndex]));
        }
      }
    }
  })

  socket.on("make-room-public", (userId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === userId && rooms[roomIndex].host.socketId === socket.id) { // user is the host and allowed to make the room public
      console.log(`made room ${rooms[roomIndex].code} public`);
      rooms[roomIndex].private = false;
    }
  })

  socket.on("make-room-private", (userId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === userId && rooms[roomIndex].host.socketId === socket.id) { // user is the host and allowed to make the room public
      console.log(`made room ${rooms[roomIndex].code} private`);
      rooms[roomIndex].private = true;
    }
  })

  socket.on("make-room-profane", (userId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === userId && rooms[roomIndex].host.socketId === socket.id) { // user is the host and allowed to make the room public
      console.log(`made room ${rooms[roomIndex].code} profane`);
      rooms[roomIndex].profane = true;
    }
  })

  socket.on("make-room-polite", (userId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === userId && rooms[roomIndex].host.socketId === socket.id) { // user is the host and allowed to make the room public
      console.log(`made room ${rooms[roomIndex].code} polite`);
      rooms[roomIndex].profane = false;
    }
  })

  socket.on("send-message", (userId, username, message) => {
    console.log(`${username} sent a message: ${message}`);
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].profane) {
      message = profanity.addProfanity(message);
    } else {
    }
    socket.to(rooms[roomIndex].code).emit("receive-message", userId, username, message);
  })

  socket.on("typing-start", (id, name) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (roomIndex > -1) {
      socket.to(rooms[roomIndex].code).emit("typing-start", id, name);
    }
  })

  socket.on("typing-stop", (id) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (roomIndex > -1) {
      socket.to(rooms[roomIndex].code).emit("typing-stop", id);
    }
  })

  socket.on("make-player-host", (oldHostId, newHostId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === oldHostId && rooms[roomIndex].host.socketId === socket.id) {
      const { playerIndex } = findPlayerById(rooms, newHostId);
      rooms[roomIndex].host = {
        id: newHostId,
        username: rooms[roomIndex].players[playerIndex].username,
        socketId: rooms[roomIndex].players[playerIndex].socketId
      }
      const roomData = cleanRoom(rooms[roomIndex])
      io.to(rooms[roomIndex].code).emit("receive-room-data", roomData);
    }

  })

  socket.on("kick-player", (hostId, playerId) => {
    const { roomIndex } = findPlayerAndRoomIndex(rooms, socket.id);
    if (rooms[roomIndex].host.id === hostId && rooms[roomIndex].host.socketId === socket.id) {
      const { playerIndex } = findPlayerById(rooms, playerId);
      const clientSocket = io.sockets.sockets.get(rooms[roomIndex].players[playerIndex].socketId);
      if (clientSocket) {
        clientSocket.disconnect(true); // Disconnect the client
      }
      const newPlayerList = rooms[roomIndex].players.filter(player => player.id !== playerId)
      rooms[roomIndex].players = newPlayerList;
      const roomData = cleanRoom(rooms[roomIndex])
      io.to(rooms[roomIndex].code).emit("receive-room-data", roomData);
    }
  })
});
// --SOCKET LOGIC--



const port = 8080;
httpServer.listen(port, () => {
  console.log(`\nServer running on port ${port}\n`);
});

// what room data does the player need when joining a room?

// each players username
// max room size
// player count
