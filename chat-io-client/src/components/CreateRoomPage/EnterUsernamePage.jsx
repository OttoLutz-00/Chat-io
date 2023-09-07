import '../../styles/EnterUsernamePage.css'
import { useRef } from 'react'
import { getItem, setItem } from '../../utils/utils';

export default function EnterUsernamePage(props) {
  const { setUsername } = props;
  const inputRef = useRef();

  const join = (event) => {
    event.preventDefault();
    setItem("username", inputRef.current.value)
    setUsername(inputRef.current.value)
  }

  return (
    <>
      <hr id="top-hr" />
      <div className="big-room-message">Before you continue creating the room,</div>
      <div className="big-room-message">what's your name?</div>
      <form id='form' onSubmit={join}>
        <input spellCheck='false' autoComplete='off' placeholder='enter username' ref={inputRef} id="username-input" required type="text" />
        <button id='button' type="submit">Continue</button>
      </form>
    </>
  )
}