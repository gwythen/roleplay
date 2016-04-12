var settings = require('./Settings.js'),
    projects = require('./projects.js'),
     ueberDB = require('ueberDB'),
     paper = require('paper');

// Database connection
var db = new ueberDB.database(settings.dbType, settings.dbSettings);

// Init..
db.init(function(err){
  if(err){
    console.error(err);
  }
});

// Write to the database
exports.storeProject = function(room) {

  var roomData = projects.projects[room].roomData;
  console.log(roomData);
  //paper project
  var project = projects.projects[room].project;
  var json = project.exportJSON();
  console.log("Writing project to database");
  db.set(room, {project: json, roomData: roomData});
}

exports.login = function(req, res, data, callback) {
  var room = data.room;
  db.get(room, function(err, value) {
    console.log(value);
    if (value) {
      if(data.pwd == value.roomData.pwd) {
        console.log("logged");        
        callback(req, res, data);
      } else {
        console.log("error");
      }
    }
  });
}

// Try to load room from database
exports.join = function(socket, room) {
  console.log("load from db");
  if (projects.projects[room] && projects.projects[room].project) {
    var project = projects.projects[room];
    db.get(room, function(err, value) {
      console.log(value);
      if (value && project.project && project.project.activeLayer) {
        console.log("loaded");
        socket.emit('loading:start');
        // Clear default layer as importing JSON adds a new layer.
        // We want the project to always only have one layer.

        project.project.activeLayer.remove();
        console.log(value);
        project.project.importJSON(value.project);
        project.roomData = value.roomData;
        socket.emit('project:load', value.project);
      }
      socket.emit('loading:end');
    });
    socket.emit('loading:end'); // used for sending back a blank database in case we try to load from DB but no project exists
  } else {
    loadError(socket);
  }
}

exports.checkAndCreateRoom = function(room, pwd, socket) {
  db.get(room, function(err, value) {
    if(value) {
      console.log("already exists");
      socket.emit('create:alreadyexist');
    } else {
      console.log("created");
      var roomData = {};
      roomData.pwd = pwd;
      var project = new paper.Project();
      db.set(room, {project: new project.exportJSON(), roomData: roomData});
      socket.emit('create:success', room, pwd);
    }

  })
}


exports.db = db;
