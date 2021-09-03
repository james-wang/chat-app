const http = require('http'); //core module
const path = require('path'); //core module
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
//Create a new web server (usually done automatically by express)
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());

const publicDirPath = path.join(__dirname, '../public');
//express static middleware to serve up whatever's in the public directory
app.use(express.static(publicDirPath));

//'connection' is a built-in event name for when each client connects
io.on('connection', (socket) => {
  console.log('New web socket connection');

  socket.on('join', ({username, room}, callback) => {
    const {error, user} = addUser({
      id: socket.id,
      username,
      room
    });

    if (error) {
      callback(error);
      return;
    }

    //socket.join() only available on server
    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      callback('Profanity is not allowed');
      return;
    }

    const user = getUser(socket.id);

    if (!user) {
      callback('User not found');
      return;
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();  //acknowledgement callback
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      callback('User not found');
      return;
    }

    io.to(user.room).emit(
      'locationMessage', 
      generateLocationMessage(
        user.username, 
        `https://google.com/maps?q=${location.latitude},${location.longitude}`));
    callback();
  });

  //'disconnect' is a built-in event for when a client disconnects
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      //no need to use socket.broadcast.emit() as the socket has already disconnected
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  }); 
});

module.exports = {app, server};

//socket.emit - send event/data to single connection
//io.emit - send event/data to all connections
//socket.broadcast.emit - send event/data to all connections except for single socket
//io.to('room').emit - send event/data to all connections of room 'room'
//socket.broadcast.to('room').emit - send event/data to all connections of room 'room' except single socket