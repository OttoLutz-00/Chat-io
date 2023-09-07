import { useEffect, useState } from 'react'
import { getAllRooms } from '../../utils/server-utils'
import { useNavigate } from 'react-router-dom';
import { getTotalPlayerCount } from '../../utils/server-utils.js';
import '../../styles/BrowseRoomsPage.css';
import refreshIcon from '../../styles/sync3.png'
export default function BrowseRoomsPage() {
  const [roomsData, setRoomsData] = useState(null)
  const [playerCount, setPlayerCount] = useState(0);
  const [clicked, setClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();



  useEffect(() => {
    getAllRooms().then((result) => {
      // console.log(result);
      setRoomsData(result);
    }).catch('error getting rooms');
    getTotalPlayerCount().then((count) => {
      setPlayerCount(count);
    })
  }, [])

  const joinRoom = (index) => {
    navigate(`/room/${roomsData[index].code}`);
  }

  const refresh = () => {
    console.log(roomsData);
    if (roomsData.length === 0) {
      setRoomsData(null)
    }
    setLoading(true);
    setClicked(true);
    // setTimeout(() => {
    //   setClicked(false);
    // }, 1000);
    getAllRooms().then((result) => {
      setRoomsData(result);
    }).catch('error getting rooms');
    getTotalPlayerCount().then((count) => {
      setPlayerCount(count);
      setLoading(false);
      setClicked(false);
    })
  }

  const goToHome = () => {
    navigate('/');
  }

  return (
    <>
      <header id="logo" onClick={goToHome}>Chat.io</header>
      <div id="container">
        <div id='topBar'>
          <div id="players-online">{playerCount} players online</div>
          <button onClick={refresh} id='refresh-button' type='submit'>
            <img id='refresh-icon' src={refreshIcon} alt="refresh rooms" className={clicked ? 'animate' : ''} />
          </button>
        </div>

        {roomsData !== null ? roomsData.map((room, index) => (
          <div className={'room ' + (loading ? "loading-room" : '')} key={index}>
            <div className='nameContainer'>
              <div className={'name ' + (loading ? "loading" : '')}>{room.hostName.length > 13 ? room.hostName.slice(0, 13) : room.hostName}
                {
                  room.hostName.length > 13 ? <div className={'dot1 ' + (loading ? "loading" : '')}>.</div> : ''
                } {
                  room.hostName.length > 13 ? <div className={'dot2 ' + (loading ? "loading" : '')}>.</div> : ''
                } {
                  room.hostName.length > 13 ? <div className={'dot3 ' + (loading ? "loading" : '')}>.</div> : ''
                }
              </div>
              <div className={'sroom ' + (loading ? "loading" : '')}>'s room</div>
            </div>
            <div className={'vl ' + (loading ? "loading-vl" : '')}></div>
            <div className='playerCount'>
              {room.playerCount}/
              {room.maxPlayerCount}
            </div>
            <button disabled={loading} className={'button ' + (loading ? "loading" : '')} onClick={() => { joinRoom(index) }}>Join</button>
          </div>
        ))
          :
          <>
            <div className='room loading-room'></div>
            <div className='room loading-room'></div>
            <div className='room loading-room'></div>
            <div className='room loading-room'></div>
          </>
        }

      </div >
    </>
  )
}