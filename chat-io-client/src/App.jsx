import './styles/main.css';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage.jsx';
import RoomPage from './components/RoomPage/RoomPage.jsx';
import CreateRoomPage from './components/CreateRoomPage/CreateRoomPage.jsx';
import BrowseRoomsPage from './components/BrowseRoomsPage/BrowseRoomsPage.jsx'
import { useState } from 'react';


export default function App() {
  console.log("App");
  const [userData, setUserData] = useState({
    id: uuidv4()
  });

  console.log(userData.id);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<HomePage />} />
        <Route path="/*" element={<Navigate to="/" />} />
        <Route path="/room/:code" element={<RoomPage user={userData} />} />
        <Route path="/create-room" element={<CreateRoomPage user={userData} />} />
        <Route path="/browse-rooms" element={<BrowseRoomsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

