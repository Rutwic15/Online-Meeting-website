import React, {useEffect, useCallback, useState} from "react";
import ReactPlayer from 'react-player';
import { useSocket } from "../context/SocketProvider";
import Peer from "../service/Peer";

const Room = () => {

    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream,setRemoteStream] = useState();

    const handleUserJoined = useCallback(({email,id}) => {
        console.log(`Email ${email} is joined`);
        setRemoteSocketId(id);
    },[]);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        const offer = await Peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
      }, [remoteSocketId, socket]);

      const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
          setRemoteSocketId(from);
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          setMyStream(stream);
          console.log(`Incoming Call`, from, offer);
          const ans = await Peer.getAnswer(offer);
          socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
      );

      const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
          Peer.peer.addTrack(track, myStream);
        }
      }, [myStream]);

      const handleCallAccepted = useCallback(
        ({ from, ans }) => {
          Peer.setLocalDescription(ans);
          console.log("Call Accepted!");
          sendStreams();
        },
        [sendStreams]
      );
    
    
    const handleNegoNeeded = useCallback(async () => {
    const offer = await Peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);


  useEffect(() => {
    Peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      Peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

    const handleNegoNeedIncoming = useCallback(async ({from,offer}) => {
        const ans = await Peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans})
    },[socket])

    const handleNegoFinal = useCallback(async({ans}) => {
        await Peer.setLocalDescription(ans);
    },[])

    useEffect(() => {
        Peer.peer.addEventListener('track',async (ev) => {
             const remoteStream = ev.streams;
             console.log("tracks");
             setRemoteStream(remoteStream[0]);
        })
    },[])

    useEffect(() => {
        socket.on("user:joined",handleUserJoined);
        socket.on("incomming:call",handleIncommingCall);
        socket.on("call:accepted",handleCallAccepted);
        socket.on("peer:nego:needed",handleNegoNeedIncoming);
        socket.on("peer:nego:final",handleNegoFinal);
        return () => {
            socket.off("user:joined",handleUserJoined);
            socket.off("incomming:call",handleIncommingCall);
            socket.off("call:accepted",handleCallAccepted);
            socket.off("peer:nego:needed",handleNegoNeedIncoming);
            socket.off("peer:nego:final",handleNegoFinal);
    }
    },[socket, handleUserJoined, handleIncommingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoFinal]);
    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one is in the room'}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            {myStream && <>
            <h1>Stream</h1>
            <ReactPlayer playing muted height="500px" width="300px" url={myStream}/>
            </>}
            {remoteStream && <>
            <h1>Remote Stream</h1>
            <ReactPlayer playing muted height="500px" width="300px" url={remoteStream}/>
            </>}
        </div>
    )
}

export default Room;