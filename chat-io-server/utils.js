const pickRandomPublicRoom = (rooms) => {
  let roomCode = null;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].private === false && rooms[i].playerCount < rooms[i].maxPlayerCount) {
      roomCode = rooms[i].code;
      break;
    }
  }
  return roomCode;
}

const generateCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  };
  return code;
};

const findPlayerAndRoomIndex = (rooms, socketId) => {
  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
    const players = rooms[roomIndex].players;
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      if (players[playerIndex].socketId === socketId) {
        return {
          playerIndex: playerIndex,
          roomIndex: roomIndex
        };
      }
    }
  }
  return {
    playerIndex: -1,
    roomIndex: -1
  };
}

const findPlayerById = (rooms, playerId) => {
  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
    const players = rooms[roomIndex].players;
    console.log("players: ", players);
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      if (players[playerIndex].id === playerId) {
        return {
          playerIndex: playerIndex,
          roomIndex: roomIndex
        };
      }
    }
  }
  return {
    playerIndex: -1,
    roomIndex: -1
  };
}

const cleanRoom = (room) => {
  const cleanedRoom = {
    maxPlayerCount: room.maxPlayerCount,
    host: {
      id: room.host.id,
      username: room.host.username
    },
    profane: room.profane,
    private: room.private,
    playerCount: room.playerCount,
    players: room.players.map(player => {
      return {
        id: player.id,
        username: player.username,
      }
    })
  }
  return cleanedRoom;
}

const getBrowseRoomData = (rooms) => {
  const cleanedRooms = [];
  for (let i = 0; i < rooms.length; i++) {
    if (!rooms[i].private) {
      cleanedRooms.push({
        playerCount: rooms[i].playerCount,
        maxPlayerCount: rooms[i].maxPlayerCount,
        hostName: rooms[i].host.username,
        code: rooms[i].code
      })
    }
  }
  return cleanedRooms;
}


module.exports = {
  generateCode,
  pickRandomPublicRoom,
  findPlayerAndRoomIndex,
  cleanRoom,
  getBrowseRoomData,
  findPlayerById
}