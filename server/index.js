const {Server} = require('socket.io');

const io = new Server(8000,{
    cors:true
});

//To track which email is in which room
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection",(socket) => {    
    console.log("Connection Established",socket.id);
    socket.on("join:room",(data) => {
        const {email,roomId} = data;
        emailToSocketIdMap.set(email,socket.id);
        socketIdToEmailMap.set(socket.id,email);
        io.to(roomId).emit("user:joined",{email, id:socket.id});
        socket.join(roomId);
        io.to(socket.id).emit("join:room",data);
    })

    socket.on("user:call",({to,offer}) => {
        io.to(to).emit("incomming:call",{from: socket.id, offer});
    });

    socket.on("call:accepted",({to,ans}) => {
        io.to(to).emit("call:accepted",{from: socket.id, ans});
    });

    socket.on("peer:nego:needed",({to,offer}) => {
        io.to(to).emit("peer:nego:needed",{from: socket.id, offer});
    });

    socket.on("peer:nego:done",({to,ans}) => {
        io.to(to).emit("peer:nego:final",{from: socket.id, ans});
    });
});