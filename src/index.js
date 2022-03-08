const express = require('express');
const http = require('http');
const path = require("path");
const socketio = require('socket.io');
const { generateMessage } = require('./utils/message');
const {getUser, addUser, getUsersInRoom, removeUser } = require('./utils/users');

const directoryPath = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
app.use(express.static(directoryPath));

io.on('connection', (socket) => {
  
  socket.on('join', ({username, room}, callback)=>{
    const {error, user} = addUser({id:socket.id, username, room});
    
    if(error){
      return callback(error);
    }
    
    socket.join(user.room);
    
    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${username} has joined the room!`))
    io.to(user.room).emit('roomData',{
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })
  
  socket.on('sentMessage', (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });
  
  socket.on('sentLocation', (coords) => {
    io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);
  });
  
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    
    if(user){
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, ()=>{
  console.log('Server is up on port', port);
})
