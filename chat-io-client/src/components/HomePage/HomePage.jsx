import { getItem, setItem } from '../../utils/utils.js'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import '../../styles/HomePage.css'
import { getTotalPlayerCount, findRoomToJoin } from '../../utils/server-utils.js';

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [showFindingRoom, setShowFindingRoom] = useState(false);
  const navigate = useNavigate();
  const roomCodeRef = useRef();

  useEffect(() => {
    const name = getItem("username");
    if (name) setUsername(name);
    getTotalPlayerCount().then((count) => {
      setPlayerCount(count);
    })
  }, [])

  const play = (event) => {
    setShowFindingRoom(true);
    event.preventDefault()
    setItem("username", username);
    findRoomToJoin().then((roomCode) => {
      navigate(`/room/${roomCode}`);
    })
  }

  const joinRoom = (event) => {
    event.preventDefault()
    navigate(`/room/${roomCodeRef.current.value}`);
  }

  const handleUsernameChange = (event) => {
    setUsername(event.target.value)
  }

  const createRoom = () => {
    navigate('/create-room');
  }

  const browseRooms = () => {
    navigate('/browse-rooms');
  }

  const goToHome = () => {
    window.location.reload()
  }

  if (showFindingRoom) {
    return (
      <div id='finding-room'>finding room...</div>
    )
  }

  return (
    <>
      <header id="logo" onClick={goToHome}>Chat.io</header>
      <div id="container">
        <div id="playersOnline">{playerCount} players chatting</div>
        <form onSubmit={play}>
          <input
            className='inputBox'
            id='usernameInput'
            placeholder="enter username"
            type="text"
            onChange={handleUsernameChange}
            value={username}
            required
            spellCheck='false'
            autoComplete='off'
          />
          <button className='button1' type="submit">Play</button>
        </form>
        <form id='joinRoomForm' onSubmit={joinRoom}>
          <input
            className='inputBox'
            id='roomInput'
            placeholder="room code"
            type="text"
            ref={roomCodeRef}
            required
            spellCheck='false'
            autoComplete='off'
          />
          <button className='button2' type="submit">Join Room</button>
        </form>
        <hr />
        <button className='otherButton' onClick={createRoom} type="submit">Create Room</button>
        <button className='otherButton' onClick={browseRooms} type="submit">Browse Rooms</button>
      </div>
    </>
  )
}


// functionality of homepage

// 'PLAY' button: takes user into random public room

// 'JOIN' button: tries to join room with provided code

// 'CREATE PRIVATE ROOM' button: takes user to another page where they create the room and then join it as host.

// 'BROWSE ROOMS' button: adds a table of rooms to the homepage that provides info and links to each room