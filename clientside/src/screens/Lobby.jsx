import React, { useState, useCallback, useEffect } from 'react';
import {useNavigate} from "react-router-dom"
import { useSocket } from '../context/SocketProvider';

const Lobby = () => {
  const [email,setEmail] = useState("");
  const [roomId,setRoomId] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();
  //console.log(socket);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit("join:room",{email,roomId});
  },[email,roomId,socket]);

  const handleJoinRoom = useCallback((data) => {
    const {email, roomId} = data;
    navigate(`/room/${roomId}`);
  },[navigate]);

  useEffect(() => {
    socket.on("join:room",handleJoinRoom);
    return () => {
      socket.off("join:room",handleJoinRoom);
    }
  },[socket,handleJoinRoom]);
  return (
    <div>
        <h1>Lobby</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor='email' >Email Id</label>
          <input type='email'value={email} onChange={e => setEmail(e.target.value)}/>
          <br/>
          <label htmlFor='room'>Room Id</label>
          <input type='room' value={roomId} onChange={e => setRoomId(e.target.value)}/>
          <br/>
          <button >Submit</button>
        </form>
    </div>
  )
}

export default Lobby