import '../../styles/EnterUsernamePage.css'
import { useRef } from 'react'
import { getItem, setItem } from '../../utils/utils.js';

export default function EnterUsernamePage(props) {
  const { setUsername, roomCode } = props;
  const inputRef = useRef();

  const join = (event) => {
    event.preventDefault();
    setItem("username", inputRef.current.value)
    setUsername(inputRef.current.value)
  }

  return (
    <>
      <div className="big-message-container">
        <div className="big-message">Before you join room <div id="room-code">{roomCode}</div>,</div>
        <div className="big-message">what's your name?</div>
      </div>
      <form id='form' onSubmit={join}>
        <input spellCheck='false' autoComplete='off' placeholder='enter username' ref={inputRef} id="username-input" required type="text" />
        <button id='button' type="submit">Join</button>
      </form>
    </>
  )
}