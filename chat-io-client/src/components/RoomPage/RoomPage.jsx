import { useEffect, useState, useRef } from "react";
import { getItem, setItem } from "../../utils/utils.js";
import { useNavigate, useParams } from 'react-router-dom';
import EnterUsernamePage from './EnterUsernamePage.jsx'
import RoomErrorPage from '../RoomErrorPage/RoomErrorPage.jsx'
import { connectToServer, connectToRoom, checkRoom } from "../../utils/server-utils.js";
import '../../styles/RoomPage.css'
import crownIcon from '../../styles/crown.png'


export default function RoomPage(props) {
  const { user } = props;
  const [username, setUsername] = useState(getItem("username"));
  const [socket, setSocket] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [showRoomFullError, setShowRoomFullError] = useState(false);
  const [showRoomNotFoundError, setShowRoomNotFoundError] = useState(false);
  const [socketEventsEstablished, setSocketEventsEstablished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(
    [
      // { content: "Sent message.", senderId: "xyz-123-45", senderName: "Otto Lutz" },
      // { content: "Received message.", senderId: "abc-123", senderName: "John Smith" },
      // { content: "Received message.", senderId: "abc-123", senderName: "John Smith" },
      // { senderName: "xWhalePimpx", info: true }
    ]
  );
  const [typers, setTypers] = useState([
    // { typerId: "111", typerName: "Joe" }
    // , { typerId: "222", typerName: "Otto" }

  ]);
  const [showUnreadMessagesButton, setShowUnreadMessagesButton] = useState({ show: false });
  const [showManageRoom, setShowManageRoom] = useState(false);

  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      const bottom = document.getElementById("bottom-chat");
      bottom.scrollIntoView({ behavior: "smooth" })
    } if (!isAtBottom && messages[messages.length - 1].senderId !== user.id && !showUnreadMessagesButton.show) { // not at bottom, not a message of your own, and dont already have an unread message
      console.log("new unread messages! at ", messages.length - 1);
      setShowUnreadMessagesButton({ show: true, mi: messages.length - 1 });
    }
  }, [messages]);

  useEffect(() => {
    console.log(typers);
    if (isAtBottom && messages.length > 0) {
      const bottom = document.getElementById("bottom-chat");
      bottom.scrollIntoView({ behavior: "smooth" })
    }
  }, [typers]);

  // useEffect(() => {
  //   console.log("bottom STATE CHANGE TO", isAtBottom)
  // }, [isAtBottom]);

  const navigate = useNavigate();
  let { code } = useParams();

  if (!username) return (<EnterUsernamePage setUsername={setUsername} roomCode={code} />)
  if (showRoomFullError) return (<RoomErrorPage message={"room is full"} />)
  if (showRoomNotFoundError) return (<RoomErrorPage message={"room not found"} />)
  if (loading) {
    return (
      <>
        <div id='finding-room'>joining room...</div>
        <div className="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
      </>
    )
  }

  if (username && code && socket === null) { // if user has everything needed to play, then try to jon the room.
    setLoading(true);
    checkRoom(code).then((result) => {
      // console.log("check room result: ", result);
      if (result.isJoinable) {
        connectToServer(user.id).then((sock) => {
          connectToRoom(sock, code, user.id, username).then((roomInfo) => {
            setRoomData(roomInfo);
            setSocket(sock);
            setLoading(false);
          }).catch((error) => {
            if (error === "room-is-full") {
              setShowRoomFullError(true);
            }
            if (error === "room-not-found") {
              setShowRoomNotFoundError(true);
            }
          })
        })
        return ("joining room...")
      } else if (result.reason === "room-is-full") {
        setShowRoomFullError(true);
      } else {
        setShowRoomNotFoundError(true);
      }
    })
  }

  const makeRoomPublic = () => {
    socket.emit("make-room-public", user.id);
    setRoomData((prev) => {
      return { ...prev, private: false }
    });
  }

  const makeRoomPrivate = () => {
    socket.emit("make-room-private", user.id);
    setRoomData((prev) => {
      return { ...prev, private: true }
    });
  }

  const toggleManageRoom = () => {
    setShowManageRoom((prev) => {
      return !prev
    })
  }

  const leaveRoom = () => {
    socket.emit("typing-stop", user.id);
    socket.disconnect();
    navigate('/');
  }

  const goToHome = () => {
    socket.emit("typing-stop", user.id);
    socket.disconnect();
    navigate('/');
  }

  const sendMessage = (event) => {
    event.preventDefault();
    if (inputValue.length > 0) {
      socket.emit("send-message", user.id, username, inputValue);
      socket.emit("typing-stop", user.id);
      setMessages((prev) => {
        return [...prev, { content: inputValue, senderId: user.id, username }]
      })
      setInputValue("");
    }
  }

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const bottom = scrollTop + clientHeight >= scrollHeight - 20;
    // console.log("at the bottom? ", bottom);
    setIsAtBottom(bottom);
    if (bottom && showUnreadMessagesButton.show) {
      setShowUnreadMessagesButton({ show: false });
    }
  }

  const handleInputChange = (event) => {
    setInputValue((prev) => {
      if (prev.length === 0 && event.target.value.length > 0) {
        // console.log("now typing");

        socket.emit("typing-start", user.id, username);
      } else if (prev.length > 0 && event.target.value.length === 0) {
        // console.log("stopped typing");

        socket.emit("typing-stop", user.id);
      }
      return event.target.value
    });
  }

  const scrollToUnreadMessages = (index) => {
    console.log("scrolling to ", "message-" + index);
    const newMessage = document.getElementById(`message-${index}`);
    newMessage.scrollIntoView({ behavior: "smooth" })
    setShowUnreadMessagesButton({ show: false });
  }

  const handlePropagation = (event) => {
    event.stopPropagation()
  }

  const handlePrivate = (event) => {
    console.log(event.target.checked);
    if (event.target.checked) {
      socket.emit("make-room-private", user.id);
      setRoomData((prev) => {
        return { ...prev, private: true }
      });
    } else {
      socket.emit("make-room-public", user.id);
      setRoomData((prev) => {
        return { ...prev, private: false }
      });
    }
  }

  const handleProfanity = (event) => {
    console.log(event.target.checked);
    if (!event.target.checked) {
      socket.emit("make-room-polite", user.id);
      setRoomData((prev) => {
        return { ...prev, profane: false }
      });
    } else {
      socket.emit("make-room-profane", user.id);
      setRoomData((prev) => {
        return { ...prev, profane: true }
      });
    }
  }

  const makePlayerHost = (id) => {
    socket.emit("make-player-host", user.id, id);
    setShowManageRoom(false)
  }

  const kickPlayer = (id) => {
    socket.emit("kick-player", user.id, id);
  }


  if (socket && !socketEventsEstablished) {
    socket.on("disconnect", (reason) => {
      console.log("socket disconnected, reason: ", reason);
      navigate('/');
    })
    socket.on("player-joined", (name, updatedRoomData) => {
      console.log(`${name} joined the room`);
      setMessages((prev) => {
        return [...prev, { senderName: name, info: true, content: "joined the room", styleClass: "joined-name" }]
      })
      setRoomData(updatedRoomData);
    });
    socket.on("player-left", (name, updatedRoomData) => {
      console.log(`${name} left the room`);
      setMessages((prev) => {
        return [...prev, { senderName: name, info: true, content: "left the room", styleClass: "left-name" }]
      })
      setRoomData(updatedRoomData);
    });
    socket.on("player-kicked", (name, updatedRoomData) => {
      console.log(`${name} was kicked from the room`);
      setMessages((prev) => {
        return [...prev, { senderName: name, info: true, content: "was kicked from the room", styleClass: "left-name" }]
      })
      setRoomData(updatedRoomData);
    });
    socket.on("receive-message", (senderId, senderName, content) => {
      setMessages((prev) => {
        return [...prev, { content: content, senderId: senderId, senderName: senderName }]
      })
    });
    socket.on("typing-start", (id, name) => {
      setTypers((prev) => {
        return [...prev, { typerId: id, typerName: name }];
      })
    });

    socket.on("typing-stop", (id) => {
      setTypers((prev) => {
        console.log(id);
        let tempTypers = [...prev];
        const t = tempTypers.filter((value) => { return value.typerId !== id });
        return t;
      })
    });

    socket.on("receive-room-data", (data) => {
      console.log("GOT ROOM DATA");
      setRoomData(data);
    });

    setSocketEventsEstablished(true);
  }

  if (socket && socketEventsEstablished) {
    console.log("--room data--,", roomData);
    return (
      <div id="click-zone" onClick={showManageRoom ? () => { setShowManageRoom(false) } : () => { }}>
        <header id="room-logo" onClick={goToHome}>Chat.io</header>

        <div id="manage-room-container" onClick={handlePropagation} hidden={!showManageRoom}>

          <div id="privateContainer">
            <label>Private Room</label>
            <input type="checkbox" onChange={handlePrivate} id='privateBox' checked={roomData.private} />
          </div>

          <hr className="line"></hr>

          <div id="profanityContainer">
            <label>Profane</label>
            <input type="checkbox" onChange={handleProfanity} id='profanityBox' checked={roomData.profane} />
          </div>

          <hr className="line"></hr>

          <div>
            {
              roomData.players.map((player, index) => (
                <div key={index} id="player-name-2" title={player.username.length > 13 ? player.username : ""}>
                  {
                    roomData.host.id === player.id ? <img id="crown" src={crownIcon}></img> : <div className="player-bullet">&bull;</div>
                  }

                  {player.username.length > 13 ?
                    <div className="manage-name">
                      {player.username.slice(0, 13)}
                      <div className='dot1'>.</div>
                      <div className='dot2'>.</div>
                      <div className='dot-3'>.</div>
                    </div>
                    : <div className="manage-name">{player.username}</div>}

                  <div className="divider"></div>
                  {
                    roomData.host.id === player.id ? "" :
                      <div className="player-options">
                        <button className="make-host-button" onClick={() => { makePlayerHost(player.id) }}>Make Host</button>
                        <button className="kick-player-button" onClick={() => { kickPlayer(player.id) }}>Kick</button>
                      </div>
                  }
                </div>

              ))
            }
          </div>

        </div>
        <div id="room-container" className={showManageRoom ? "hidden" : ""}>
          <div id="left-menu">
            <div id="left-menu-header">
              {
                roomData.host.id !== user.id ?
                  roomData.host.username.length > 13 ?
                    <div title={roomData.host.username}>
                      {roomData.host.username.slice(0, 13)}
                      <div className='dot1'>.</div>
                      <div className='dot2'>.</div>
                      <div className='dot-3'>.</div>
                      <div className="s-room">'s room</div>
                    </div>
                    :
                    <div>
                      {roomData.host.username}
                      <div className="s-room">'s room</div>
                    </div>
                  :
                  'your room'
              }
            </div>
            <hr id="left-menu-hr" />
            {
              roomData.players.map((player, index) => (
                <div key={index} id="player-name" title={player.username.length > 13 ? player.username : ""}>
                  {
                    roomData.host.id === player.id ? <img id="crown" src={crownIcon}></img> : <div className="player-bullet">&bull;</div>
                  }

                  {player.username.length > 13 ?
                    <>
                      {player.username.slice(0, 13)}
                      <div className='dot1'>.</div>
                      <div className='dot2'>.</div>
                      <div className='dot-3'>.</div>
                    </>
                    : player.username}
                </div>

              ))
            }
            <button id="leave-room-button" onClick={leaveRoom}>Leave Room</button>

            {
              roomData.host.id === user.id ?
                <button className="manage-room-button" onClick={toggleManageRoom}>Manage Room</button> : ""
            }

          </div>
          <div id="right-menu">
            <div id="chat-window" onScroll={handleScroll}>
              {
                messages.map((message, index) => (
                  message.info ?
                    <div id={`message-${index}`} key={index} className="info-message">
                      <div className={message.styleClass}>{message.senderName.length < 13 ? message.senderName : message.senderName.slice(0, 13) + "..."}</div>
                      {` ${message.content}`}
                    </div>
                    :
                    message.senderId === user.id ?
                      <div id={`message-${index}`} key={index} className={messages[index - 1] && messages[index - 1].senderId === message.senderId ? "sent-message" : "sent-message-extra-space"}>{message.content}</div>
                      :
                      messages[index - 1] && messages[index - 1].senderId === message.senderId ?
                        <div id={`message-${index}`} key={index}>
                          <div key={index} className="received-message">{message.content}</div>
                        </div>

                        :
                        <div id={`message-${index}`} key={index}>
                          <div className="message-sender">{message.senderName.length < 13 ? message.senderName : message.senderName.slice(0, 13) + "..."}</div>
                          <div className="received-message">{message.content}</div>
                        </div>
                ))
              }
              <div id="bottom-chat"></div>
              {
                typers.map((typer, index) => (
                  <div className={index === 0 ? " typing typer" : "typing typer-2"} key={typer.typerId}>{typer.typerName.length < 13 ? typer.typerName + " is typing..." : typer.typerName.slice(0, 13) + "... is typing..."}</div>
                ))
              }
            </div>

            <form id="text-bar" action="" onSubmit={sendMessage}>
              {
                showUnreadMessagesButton.show ?
                  <button onClick={() => { scrollToUnreadMessages(showUnreadMessagesButton.mi) }} id="view-unread-button">&#x2193; New Messages &#x2193;</button> : ''

              }
              <input
                title=""
                spellCheck='false'
                autoComplete='off'
                // className="inputBox"
                onChange={handleInputChange}
                id="text-input"
                type="text"
                value={inputValue} />
              <button id="send-button">Send</button>
            </form>

          </div>
        </div>
      </div>
    )
  };
}