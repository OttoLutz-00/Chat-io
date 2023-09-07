import '../../styles/RoomErrorPage.css'
import { useNavigate } from 'react-router-dom';
export default function RoomErrorPage(props) {
  const { message } = props
  const navigate = useNavigate();

  const backToHome = () => {
    navigate('/')
  }
  return (
    <>
      <div id="message">{message}</div>
      <button onClick={backToHome} id='homeButton'>Back to home</button>
    </>
  );
}