var socket = io();

$(".newroom-button").click(function() {
    checkAndCreateRoom();
});

function checkAndCreateRoom() {
  var roomName = cleanInput($("#roomNameInput").val().trim());
  //TODO: check that the room name is available
  var currUrl = window.location.href;

  var pwd = cleanInput($("#pwdInput").val().trim());

  socket.emit('create:room', roomName, pwd);

}

socket.on('create:success', function(room) {
	var currUrl = window.location.href;
	window.location.href = currUrl + room;
});

// Prevents input from having injected markup
function cleanInput (input) {
	return $('<div/>').text(input).text();
}

socket.on('create:alreadyexist', function() {
	console.log("the room already exists");
});