import { useState } from "react"
import { getItem, setItem } from "../../utils/utils.js";
import EnterUsernamePage from "./EnterUsernamePage";
import { useNavigate } from 'react-router-dom';
import { createRoom } from "../../utils/server-utils.js";
import '../../styles/CreateRoomPage.css'

export default function CreateRoomPage(props) {
  const [username, setUsername] = useState(getItem("username"));
  const [sliderValue, setSliderValue] = useState("4");
  const [profanityChecked, setProfanityChecked] = useState(false);
  const [privateChecked, setPrivateChecked] = useState(false);
  const [showGeneratingRoom, setShowGeneratingRoom] = useState();
  const navigate = useNavigate();

  if (!username) {
    return (<EnterUsernamePage setUsername={setUsername} />)
  }

  const handleSliderChange = (event) => {
    console.log("handling slider change");
    setSliderValue(event.target.value);
  };

  const sendCreateRoom = (event) => {
    setShowGeneratingRoom(true);
    event.preventDefault();
    createRoom({
      maxPlayerCount: sliderValue,
      profane: profanityChecked,
      private: privateChecked,
    }).then((code) => {
      navigate(`/room/${code}`);
    });
  }

  const handlePrivate = (event) => {
    console.log(event.target.checked);
    setPrivateChecked(event.target.checked);
  }

  const handleProfanity = (event) => {
    console.log(event.target.checked);
    setProfanityChecked(event.target.checked);
  }

  const goToHome = () => {
    navigate('/');
  }

  if (showGeneratingRoom) {
    return (
      <div id="finding-room">
        Creating room...
      </div>
    )
  }

  return (
    <>
      <div id="logo" onClick={goToHome}>Chat.io</div>
      <form onSubmit={sendCreateRoom} id="create-room-form" className="containerrr">
        <div id="room-size-input-container">
          <label id="players">Players</label>
          <div id="splitter"></div>
          <input required id="slider" onChange={handleSliderChange} type="range" min="2" max="10" defaultValue="4" />
          <div id="slider-label">{sliderValue}</div>
        </div>
        <hr className="line" />
        <div id='profanityContainer'>
          <label className="labelCenter">Profane</label>
          <input onChange={handleProfanity} id='profanityBox' type="checkbox" />
        </div>
        <hr className="line" />
        <div id='privateContainer'>
          <label className="labelCenter">Private</label>
          <input onChange={handlePrivate} id='privateBox' type="checkbox" />
        </div>
        <hr className="line" />
        <button id="create-room-button" type="submit">Create Room</button>
      </form>
    </>
  )
}
// --create room options--
// *max room size=2
// *profanity filter
// ?profanity only filter?
// ?roomType=[hangman, ]