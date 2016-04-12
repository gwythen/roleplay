var $usernameInput = $('#usernameInput'); // Input for username
var $pwdInput = $('#pwdInput'); // Input for username

var socket = io();

$(".login-button").click(function() {
    joinRoom();
});
  

function joinRoom () {
	var username = cleanInput($usernameInput.val().trim());
	var pwd = cleanInput($pwdInput.val().trim());
	var color = getUsernameColor(username);
	var room = ROOM;

	// If the username is valid
	if (username && pwd) {
	  // Tell the server your username
	  //change to ajax
	  //socket.emit('add user', username, pwd, color, room);

	  var jqxhr = $.post( "/login/" + room, { username: username, pwd: pwd, color: color})
		  .done(function() {
		  	location.reload();
		  })
		  .fail(function() {
		    alert( "error" );
		  });
	}
}

socket.on('login', function (data) {
	location.reload();
});


// Prevents input from having injected markup
function cleanInput (input) {
	return $('<div/>').text(input).text();
}

  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

// Gets the color of a username through our hash function
function getUsernameColor (username) {
	// Compute hash code
	var hash = 7;
	for (var i = 0; i < username.length; i++) {
	   hash = username.charCodeAt(i) + (hash << 5) - hash;
	}
	// Calculate color
	var index = Math.abs(hash % COLORS.length);
	return COLORS[index];
}