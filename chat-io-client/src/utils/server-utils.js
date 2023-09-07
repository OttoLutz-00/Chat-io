import { io } from 'socket.io-client';
const serverURL = "http://localhost:8080"

export const connectToServer = async (userId) => {
  return new Promise((resolve, reject) => {
    let socket = io(serverURL, {
      query: {
        id: userId
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });
    socket.on('connect', () => {
      console.log("connection-successful");
      resolve(socket);
    });
    socket.on('connect_error', (error) => {
      console.log("connect error");
      reject(error);
    });
  });
};

export const connectToRoom = async (socket, roomCode, userId, username) => {
  return new Promise((resolve, reject) => {
    socket.emit("join-room", roomCode, userId, username);
    socket.on("receive-room-data", (data) => {
      resolve(data);
    });
    socket.on("room-is-full", () => {
      reject("room-is-full");
    });
    socket.on("room-not-found", () => {
      reject("room-not-found");
    });
  });
};

export const findRoomToJoin = () => {
  return new Promise((resolve, reject) => {
    fetch('http://localhost:8080/api/find-room')
      .then(response => response.json())
      .then(data => {
        resolve(data.code);
      })
      .catch(error => {
        reject(error);
      });
  })
};

export const createRoom = (options) => {
  console.log(options.profane, options.private);
  return new Promise((resolve, reject) => {
    fetch(`http://localhost:8080/api/create-room?maxPlayerCount=${options.maxPlayerCount}&profane=${options.profane}&private=${options.private}`)
      .then(response => response.json())
      .then(data => {
        resolve(data.code);
      })
      .catch(error => {
        reject(error);
      });
  })
}

export const getTotalPlayerCount = () => {
  return new Promise((resolve, reject) => {
    fetch('http://localhost:8080/api/player-count')
      .then(response => response.json())
      .then(data => {
        resolve(data.count);
      })
      .catch(error => {
        reject(error);
      });
  })
};

export const checkRoom = (code) => {
  return new Promise((resolve, reject) => {
    fetch(`http://localhost:8080/api/check-room?code=${code}`)
      .then(response => response.json())
      .then(data => {
        resolve({ isJoinable: data.isJoinable, reason: data.reason });
      })
      .catch(error => {
        reject(error);
      });
  })
}

export const createPrivateRoom = async (socket, roomCode, userId, username) => {
  return new Promise((resolve, reject) => {

  });
};

export const getAllRooms = () => {
  return new Promise((resolve, reject) => {
    fetch(`http://localhost:8080/api/get-rooms`)
      .then(response => response.json())
      .then(data => {
        resolve(data.rooms);
      })
      .catch(error => {
        reject(error);
      });
  })
}



// *any room, public or private can be joined if you have the room code

// server will store array of rooms like so:
//  const rooms = [
//    room1,
//    room2,
//    room3,
//    {
//      maxPlayerCount: 8,
//      code: 'abc123',
//      profanityFilter: true
//      players: [
//        p1,
//        p2,
//        p3,
//        {
//          username: "otto",
//          id: "abcd-1234-abcd-1234",
//          socketId: "1827edqgd18qygwd123"
//        }
//      ]
//    }
//  ];

//  socket.emit("send-message", roomCode, message, user.id);

//  socket.on("send-message", (roomCode, message, userId) => {
//    const senderUsername = getUsernameFromId(userId, socket.id);

//    if (profanity filter is on for this room) {
//      message = censorBadWords(message);
//    }

//    socket.to(roomCode).emit("receive-message", message, senderUsername);
//  });

//  socket.on("receive-message", (message, senderUsername ) => {
//    showMessage(message, senderUsername);
//  });


// important concepts:
//  - players should not know other players id's.
//  - server will keep track of socket id and what user id is associated with the socket.
//    So if a player tries to impersonate another by using their id when sending a message, the server will know because the socket.id will not match the user id.