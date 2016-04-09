$("#roomNameInput").keydown(function(event) {
  if (event.which === 13) {
      checkAndCreateRoom();
  }
});

function checkAndCreateRoom() {
  var roomName = cleanInput($("#roomNameInput").val().trim());
  //TODO: check that the room name is available
  var currUrl = window.location.href;
  window.location.href = currUrl + roomName;
}