$(document).ready(function(){

  // socket.emit('add user', {user: USER_NAME, color: USER_COLOR, room: ROOM});
  var stream = {
    title: "Roleplay",
    mp3: AUDIO_STREAM
  },
  ready = false;
  var paused = false;
  var playing = false;
  $("#jquery_jplayer_1").jPlayer({
    ready: function (event) {
      ready = true;
      $(this).jPlayer("setMedia", stream);
    },
    pause: function() {
      $(this).jPlayer("clearMedia");
    },
    error: function(event) {
      if(ready && event.jPlayer.error.type === $.jPlayer.error.URL_NOT_SET) {
        // Setup the media stream again and play it.
        $(this).jPlayer("setMedia", stream).jPlayer("play");
      }
    },
    swfPath: ".",
    supplied: "mp3",
    preload: "none",
    wmode: "window",
    useStateClassSkin: true,
    autoBlur: false,
    keyEnabled: true
  });

  $("#drive-button").on('click', function(e) {
    $('#google-drive').toggleClass("open"); //you can list several class names 
    e.preventDefault();
  });

  $("#google-drive").height($("#content").innerHeight());

  $(".jp-play").on('click', function() {
    if(!playing) {
      paused = false;
      playing = true;
      $("#jquery_jplayer_1").jPlayer("setMedia", stream).jPlayer("play");
    } else {
      paused = true;
      playing = false;
      $("#jquery_jplayer_1").jPlayer("clearMedia");
    }
  });

});



$(document).on('click', '.icon-minim', function (e) {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('#chat').find('.chatArea').slideUp();
        $this.addClass('panel-collapsed');
        $this.removeClass('icon-minus').addClass('icon-plus');
    } else {
        $this.parents('#chat').find('.chatArea').slideDown();
        $this.removeClass('panel-collapsed');
        $this.removeClass('icon-plus').addClass('icon-minus');
    }
});

  //Chat

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $messages = $('.chat-messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $chatPage = $('#chat'); // The chatroom page
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var username = USER_NAME;
  var $currentInput = $inputMessage.focus();

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }



  function parseCommand (message) {
  	var command = message.split("#")[1];
  	//var commandPattern = /[0-9]d[0-9]+/;
  	var commandPattern = /[0-9]d6/;

  	if(commandPattern.test(command)) {
  		var diceQuantity = command.split("d")[0];
  		var diceType = command.split("d")[1];
  		var result = diceRoller(diceQuantity, diceType);
  		sendMessage("rolls " + diceQuantity + "d" + diceType + " = " + result);
  	} else {
  		$inputMessage.val('');
  		log("Sorry, unknown command #" + command, {error: true});
  	}
  }

  function diceRoller (quantity, type) {
  	var result = 0;
  	var dieroll = 0;
  	for(var i = 0; i < quantity; i++) {
  		dieroll = Math.floor(Math.random() * 6) + 1;
  		switch(dieroll) {
  			case 1:
  			case 2:
  			case 3:
  			default:
  				result = result + 0;
  				break;
  			case 4:
  			case 5:
  				result = result + 1;
  				break;
  			case 6: 
  				result = result + 2;
  				break;
  		}
  	}
  	return result;
  }

  // Sends a chat message
  function sendMessage (message) {
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.error) {
    	$el.addClass("error");
    }
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;
    $(".chatArea")[0].scrollTop = $(".chatArea")[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

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

  // Keyboard events

  $inputMessage.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
      	if($inputMessage.val()[0] == "#") {
      		parseCommand($inputMessage.val());
      	} else {
      		sendMessage($inputMessage.val());
      	}
        socket.emit('stop typing');
        typing = false;
      } else {
        console.log("something strange's happening, a user typing without being logged in");
      }
    }
  });

  // Socket events

  

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome " + username + "!";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('loading:end', function() {
    console.log("loading:end");
  });

