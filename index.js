var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ejs = require('ejs');
var url = require('url');

var settings = require('./util/Settings.js'),
tests = require('./util/tests.js'),
draw = require('./util/draw.js'),
projects = require('./util/projects.js'),
db = require('./util/db.js'),
paper = require('paper'),
async = require('async'),
fs = require('fs'),
https = require('https');


app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/static/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


/** 
 * Build Client Settings that we will send to the client
 */
var clientSettings = {
  "tool": settings.tool
}

var numUsers = 0;;

// app.get('/', function(req, res){
//   res.render('index.html', {googleDrive: settings.googleDriveFolder, audioStream: settings.audioStream});
// });

app.get('/', function(req, res){
  res.render('index.html');
});
app.get('/:roomName', function(req, res) {
  res.render('board.html', {googleDrive: settings.googleDriveFolder, audioStream: settings.audioStream});
  console.log("room is set to " + req.params.roomName);
});



io.on('connection', function(socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, color) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    socket.usercolor = color;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
    startDrawing(socket, {room: "room"});
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

   // EVENT: User draws a textbox
   socket.on('draw:textbox', function (room, uid, textbox) {
     if (!projects.projects[room] || !projects.projects[room].project) {
       loadError(socket);
       return;
     }
     io.in(room).emit('draw:textbox', uid, textbox);
     draw.addTextbox(room, JSON.parse(textbox));
   });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:progress', function (room, uid, co_ordinates) {
    if (!projects.projects[room] || !projects.projects[room].project) {
      loadError(socket);
      return;
    }
    io.emit('draw:progress', uid, co_ordinates);
    draw.progressExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:end', function (room, uid, co_ordinates) {
    if (!projects.projects[room] || !projects.projects[room].project) {
      loadError(socket);
      return;
    }
    io.emit('draw:end', uid, co_ordinates);
    draw.endExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  socket.on('draw:mousemove', function(room, uid, co_ordinates) {
    if (!projects.projects[room] || !projects.projects[room].project) {
      loadError(socket);
      return;
    }
    io.emit('draw:mousemove', uid, co_ordinates, socket.username, socket.usercolor);
  });

  // User clears canvas
  socket.on('canvas:clear', function(room) {
    if (!projects.projects[room] || !projects.projects[room].project) {
      loadError(socket);
      return;
    }
    draw.clearCanvas(room);
    io.emit('canvas:clear');
  });

  // User removes an item
  socket.on('item:remove', function(room, uid, itemName) {
    draw.removeItem(room, uid, itemName);
    io.sockets.emit('item:remove', uid, itemName);
  });

  // User moves one or more items on their canvas - progress
  socket.on('item:move:progress', function(room, uid, itemNames, delta) {
    draw.moveItemsProgress(room, uid, itemNames, delta);
    if (itemNames) {
      io.sockets.emit('item:move', uid, itemNames, delta);
    }
  });

  // User moves one or more items on their canvas - end
  socket.on('item:move:end', function(room, uid, itemNames, delta) {
    draw.moveItemsEnd(room, uid, itemNames, delta);
    if (itemNames) {
      io.sockets.emit('item:move', uid, itemNames, delta);
    }
  });

  // User adds a raster image
  socket.on('image:add', function(room, uid, data, position, name) {
    draw.addImage(room, uid, data, position, name);
    io.sockets.emit('image:add', uid, data, position, name);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

// Subscribe a client to a room
function startDrawing(socket, data) {
  var room = data.room;

  // If the close timer is set, cancel it
  // if (closeTimer[room]) {
  //  clearTimeout(closeTimer[room]);
  // }

  // Create Paperjs instance for this room if it doesn't exist
  var project = projects.projects[room];
  if (!project) {
    console.log("made room");
    projects.projects[room] = {};
    // Use the view from the default project. This project is the default
    // one created when paper is instantiated. Nothing is ever written to
    // this project as each room has its own project. We share the View
    // object but that just helps it "draw" stuff to the invisible server
    // canvas.
    projects.projects[room].project = new paper.Project();
    projects.projects[room].external_paths = {};
    db.load(room, socket);
  } else { // Project exists in memory, no need to load from database
    loadFromMemory(room, socket);
  }
}

// Send current project to new client
function loadFromMemory(room, socket) {
  var project = projects.projects[room].project;
  if (!project) { // Additional backup check, just in case
    db.load(room, socket);
    return;
  }
  socket.emit('loading:start');
  var value = project.exportJSON();
  socket.emit('project:load', {project: value});
  socket.emit('settings', clientSettings);
  socket.emit('loading:end');
}

function loadError(socket) {
  socket.emit('project:load:error');
}
