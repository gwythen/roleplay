// Please refactor me, this is mostly a complete car crash with globals everywhere.

tool.minDistance = 10;
tool.maxDistance = 45;

var room = "room";

function pickColor(color) {
  $('#color').val(color);
  var rgb = hexToRgb(color);
  $('#activeColorSwatch').css('background-color', 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')');
  update_active_color();
}

/**
 * Position picker next to cursor in the bounds of the canvas container
 *
 * @param cursor {Point} Cursor position relative to the page
 */
function positionPickerInCanvas(cursor) {
  var picker = $('#mycolorpicker');
  
  // Determine best place for color picker so it isn't off the screen
  var pickerSize = new Point(picker.width(), picker.height());
  var windowSize = new Point($(window).width(), $(window).height());
  var spacer = new Point(10, 0);

  var brSpace = windowSize - spacer - cursor;
  var tlSpace = cursor - spacer;

  var newPos = new Point();

  // Choose sides based on page size
  if (tlSpace.x > pickerSize.x) {
    // Plus a magic number...?
    newPos.x = cursor.x - (pickerSize.x + 20 + spacer.x);
  } else if (brSpace.x > pickerSize.x) {
    newPos.x = cursor.x + spacer.x;
  }
  
  // Get the canvasContainer's position so we can make sure the picker
  // doesn't go outside of the canvasContainer (to keep it pretty)
  var minY = 10;
  // Buffer so we don't get too close to the bottom cause scroll bars
  var bBuffer = Math.max(50, (windowSize.y - ($('#canvasContainer').position().top 
      + $('#canvasContainer').height())) + 70);

  // Favour having the picker in the middle of the cursor
  if (tlSpace.y > ((pickerSize.y / 2) + minY) && brSpace.y > ((pickerSize.y / 2) + bBuffer)) {
    newPos.y = cursor.y - (pickerSize.y / 2);
  } else if (tlSpace.y < ((pickerSize.y / 2) + minY) && brSpace.y > (tlSpace.y - (pickerSize.y + minY))) {
    newPos.y = minY;
  } else if (brSpace.y < ((pickerSize.y / 2) + bBuffer) && tlSpace.y > (brSpace.y - (pickerSize.y + bBuffer))) {
    newPos.y = windowSize.y - (pickerSize.y + bBuffer);
  }
  
  $('#mycolorpicker').css({
    "left": newPos.x,
    "top": newPos.y
  }); // make it in the smae position
}

/**
 * Scale the canvas by the given new scale.
 *
 * @param scale {Float} Scale diff to apply to the canvas
 * @param pos {Point} Position where to center zoom around on the canvas
 *        in screen pixels (unscaled)
 */
function scaleCanvas(scale, scaleDiff, pos) {
  // Determine where the cursor currently is
  var focusPoint = new Point(view.bounds.x, view.bounds.y);
  if (pos) { // Point given
    focusPoint += (pos / view.zoom);
  } else { // Center of canvas
    focusPoint += new Point(view.bounds.width, view.bounds.height) / 2;
  }

  // Scale to a minimum 5%
  view.zoom = Math.max(0.05,
      (scale === false ? view.zoom + scaleDiff : scale));

  view.draw();

  // Scroll so same point is below pos again, limiting so we don't show -ve
  // of canvas
  var offset = new Point(view.bounds.x, view.bounds.y);
  if (pos) { // Point given
    offset += (pos / view.zoom);
  } else { // Center of canvas
    offset += new Point(view.bounds.width, view.bounds.height) / 2;
  }
  
  var delta = focusPoint - offset;

  // Scroll the where the mousey is
  // Limit delta so we can't scroll into the -ve
  var center = view.center;
  var minCenter = view.size / 2;
  var newCenter = center + delta;
  // Calculate the bad delta: the newCentre - minCenter, keep -ve values
  var badDelta = Point.min(newCenter - minCenter, new Point(0, 0));

  // Add the bad delta to the delta make sure we won't go into the -ves
  delta -= badDelta;

  // Pretty scroll
  view.scrollBy(delta);

  updateCoordinates();
}

/**
 * Update the stats in the coordinates box
 */
function updateCoordinates() {
  $('#coordinates').html(view.bounds.x.toFixed(0) + ',' + view.bounds.y.toFixed(0));
  $('#zoom').html(view.zoom.toFixed(2));
};

/**
 * Returns a Point containing the position of the cursor or an averaged
 * position of fingers for the given value.
 *
 * Created as the one included with the Paper library seems to be buggy.
 *
 * @param event {Event} The event to extract the position from
 * @param type {'client'|'page'|'screen'} The position to extract
 */
function getEventPoint(event, type) {
  //@TODO if (!(event instanceof Event)) throw new TypeError('event needs to be an actual Event object (not a ctor event)');
  if (typeof type !== 'string') throw new TypeError('type needs to be a string value of client, page or screen');
  if (['client', 'page', 'screen'].indexOf(type) === -1) throw new RangeError('type needs to be either client, page or screen');

  if (event.touches) {
    var point = new Point();
    var t;
    for (t in event.touches) {
      point += new Point(event.touches[t][type + 'X'], event.touches[t][type + 'Y']);
    }
    point = point / event.touches.length;
    return point;
  } else {
    return new Point(event[type + 'X'], event[type + 'Y']);
  }
}


/*http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb*/
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


$(document).ready(function() {
  var drawurl = window.location.href.split("?")[0]; // get the drawing url
  $('#embedinput').val("<iframe name='embed_readwrite' src='" + drawurl + "?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false' width=600 height=400></iframe>"); // write it to the embed input
  $('#linkinput').val(drawurl); // and the share/link input
  $('#drawTool > a').addClass("selected"); // set the drawtool css to show it as active

  $('#myCanvas').bind('mousewheel', function(ev) {
    scrolled(ev.pageX, ev.pageY, -ev.wheelDelta);
  });

  $('#myCanvas').bind('DOMMouseScroll', function(ev) {
    scrolled(ev.pageX, ev.pageY, ev.detail);
  });

  $('#myCanvas').bind('wheel', function(event) {
    // Find the scroll delta
    var delta;

    if (event.originalEvent) {
      // Determine the new scale factor -ve for scaling up
      var mul;
      switch(event.originalEvent.deltaMode) {
        case 0: // Pixel
          mul = -0.002;
          break;
        case 1: // Line
          mul = -0.02;
          break;
        case 2: //Page
          mul = -0.1;
          break;
      }

      delta = new Point(event.originalEvent.deltaX * mul,
          event.originalEvent.deltaY * mul);

      // Find the biggest scale
      if (Math.abs(delta.x) > Math.abs(delta.y)) {
        delta = delta.x;
      } else {
        delta = delta.y;
      }

      // Calculate the mouse point relative to the canvas (for centering)
      var point = getEventPoint(event.originalEvent, 'client');
      var offset = $('#myCanvas').offset();
      offset = new Point(offset.left, offset.top);
      point -= offset;

      // Scale away
      scaleCanvas(false, delta, point);
    }
  });

  var drawingPNG = localStorage.getItem("drawingPNG"+room)

  // Temporarily set background as image from memory to improve UX
  $('#canvasContainer').css("background-image", 'url(' + drawingPNG + ')');

});

var scaleFactor = 1.1;

function scrolled(x, y, delta) {
  // Far too buggy for now
  /*
  console.log("Scrolling");
  var pt = new Point(x, y),
  scale = 1;
  if(delta < 0) {
    scale *= scaleFactor;
  } else if(delta > 0) {
    scale /= scaleFactor;
  }
  //view.scale(scale, pt);
  $('#myCanvas').
  view.draw();
  */
}



$('#activeColorSwatch').css('background-color', $('.colorSwatch.active').css('background-color'));

// Random User ID
// Used when sending data
var uid = (function() {
  var S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}());

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if (results == null) {
    return "";
  } else {
    return decodeURIComponent(results[1].replace(/\+/g, " "));
  }
}


// JSON data ofthe users current drawing
// Is sent to the user
var path_to_send = {};

// Calculates colors
var active_color_rgb;
var active_color_json = {};
var $opacity = $('#opacityRangeVal');
var update_active_color = function() {
  var rgb_array = $('#activeColorSwatch').css('background-color');
  $('#editbar').css("border-bottom", "solid 2px " + rgb_array);

  while (rgb_array.indexOf(" ") > -1) {
    rgb_array = rgb_array.replace(" ", "");
  }
  rgb_array = rgb_array.substr(4, rgb_array.length - 5);
  rgb_array = rgb_array.split(',');
  var red = rgb_array[0] / 255;
  var green = rgb_array[1] / 255;
  var blue = rgb_array[2] / 255;
  var opacity = $opacity.val() / 255;

  active_color_rgb = new RgbColor(red, green, blue, opacity);
  active_color_rgb._alpha = opacity;
  active_color_json = {
    "red": red || 0,
    "green": green,
    "blue": blue,
    "opacity": opacity
  };
};

// Get the active color from the UI eleements
var authorColor = getParameterByName('authorColor');
var authorColors = {};
if (authorColor != "" && authorColor.substr(0, 4) == "rgb(") {
  authorColor = authorColor.substr(4, authorColor.indexOf(")") - 4);
  authorColors = authorColor.split(",");
  $('#activeColorSwatch').css('background-color', 'rgb(' + authorColors[0] + ',' + authorColors[1] + ',' + authorColors[2] + ')');
}
update_active_color();



$('#colorToggle').on('click', function() {
  if ($('#mycolorpicker').toggle().is(':visible')) {
    positionPickerInCanvas(new Point(event.pageX, event.pageY));
  }
});

$('#clearImage').click(function() {
  var p = confirm("Are you sure you want to clear the drawing for everyone?");
  if (p) {
    clearCanvas();
    socket.emit('canvas:clear', room);
  }
});

$('.toggleBackground').click(function() {
  $('#myCanvas').toggleClass('whiteBG');
});

// --------------------------------- 
// DRAWING EVENTS


var send_paths_timer;
var timer_is_active = false;
var paper_object_count = 0;
var activeTool = "pencil";
var mouseTimer = 0; // used for getting if the mouse is being held down but not dragged IE when bringin up color picker
var mouseHeld; // global timer for if mouse is held.
var path; // Used to store the path currently being drawn

var fingers; // Used for tracking how many finger have been used in the last event
var previousPoint; // Used to track the previous event point for panning
var previousFingerSeparation; // Used to store how far apart the fingers were at the start

function onMouseDown(event) {
    event.preventDefault();
  if (event.which === 2) return; // If it's middle mouse button do nothing -- This will be reserved for panning in the future.
  $('.popup').fadeOut();

  // Ignore right mouse button clicks for now
  if (event.event.button == 2) {
    return;
  }

  // Hide color picker if it is visible already
  var picker = $('#mycolorpicker');
  if (picker.is(':visible')) {
    picker.toggle(); // show the color picker
  }

  // Store the number of fingers we have so we can use it on mouseUp
  if (event.event.touches) {
    fingers = event.event.touches.length;
  } else {
    fingers = 0;
  }

  // Pan - Middle click, click+shift or two finger touch for canvas moving
  // Will also handle scaling using pinch gestures
  if (event.event.button == 1 
      || (event.event.button == 0 && event.event.ctrlKey)
      || (event.event.touches && event.event.touches.length == 2)) {
    previousPoint = getEventPoint(event.event, 'client');
    var canvas = $('#myCanvas');
    canvas.css('cursor', 'move');
    // Store the finger separation if we have fingers
    if (event.event.touches) {
      // Clear the current path
      path.remove();
      path = false;
      previousFingerSeparation = (new Point(
          event.event.touches[0].clientX, event.event.touches[0].clientY) -
          new Point (event.event.touches[1].clientX, event.event.touches[1].clientY)
      ).length;
    }
    return;
  }

  mouseTimer = 0;
  if (!mouseHeld) {
    mouseHeld = setInterval(function() { // is the mouse being held and not dragged?
    mouseTimer++;
    if (mouseTimer > 3) {
      mouseTimer = 0;
      clearInterval(mouseHeld);
      mouseHeld = undefined;
      var picker = $('#mycolorpicker');
      picker.toggle(); // show the color picker
      if (picker.is(':visible')) {
        // Get position of cursor
        var point = getEventPoint(event.event, 'client');
        var position = $('#myCanvas').position();
        // Takeaway offset of canvas
        point -= new Point(position.left, position.top);
        positionPickerInCanvas(point);
      }
    }
  }, 100);
  }

  if (activeTool == "draw" || activeTool == "pencil") {
    var point = event.point;
    path = new Path();
    if (activeTool == "draw") {
      path.fillColor = active_color_rgb;
    } else if (activeTool == "pencil") {
      path.strokeColor = active_color_rgb;
      path.strokeWidth = 2;
    }
    path.add(event.point);
    path.name = uid + ":" + (++paper_object_count);
    view.draw();

    // The data we will send every 100ms on mouse drag
    path_to_send = {
      name: path.name,
      rgba: active_color_json,
      start: event.point,
      path: [],
      tool: activeTool
    };
  } else if (activeTool == "select") {
    // Select item
    $("#myCanvas").css("cursor", "pointer");
    if (event.item) {
      // If holding shift key down, don't clear selection - allows multiple selections
      if (!event.event.shiftKey) {
        paper.project.activeLayer.selected = false;
      }
      event.item.selected = true;
      view.draw();
    } else {
      paper.project.activeLayer.selected = false;
    }
  }
}

var item_move_delta;
var send_item_move_timer;
var item_move_timer_is_active = false;

function onMouseDrag(event) {
  event.preventDefault();
  mouseTimer = 0;
  clearInterval(mouseHeld);
  mouseHeld = undefined;

  // Ignore middle or right mouse button clicks for now
  if (event.event.button == 2) {
    return;
  }

  // Hide the color picker if it is showing
  if ($('#mycolorpicker').is(':visible')) {
    $('#mycolorpicker').toggle();
  }

  /* Pan / Pinch zoom - Middle click, click+shift or two finger touch for
   * canvas moving and zooming if fingers are involved
   */
  if (event.event.button == 1 
      || (event.event.button == 0 && event.event.ctrlKey)
      || (event.event.touches && event.event.touches.length == 2)) {
    // Calculate our own delta as the event delta is relative to the canvas
    var point = getEventPoint(event.event, 'client');
    var delta = (previousPoint - point) / view.zoom;

    // Limit delta so we can't scroll into the -ve
    var center = view.center;
    var minCenter = view.size / 2;
    var newCenter = center + delta;
    // Calculate the bad delta: the newCentre - minCenter, keep -ve values
    var badDelta = Point.min(newCenter - minCenter, new Point(0, 0));

    // Add the bad delta to the delta make sure we won't go into the -ves
    delta -= badDelta;

    var startBounds = view.bounds;
  
    // Pretty scroll
    view.scrollBy(delta);

    // Store the new point so we just calculate a delta for next event
    previousPoint = point;

    // Zoom if touching and breach the buffer
    if (event.event.touches) {
      var separation =(new Point(
          event.event.touches[0].clientX, event.event.touches[0].clientY) -
          new Point (event.event.touches[1].clientX, event.event.touches[1].clientY)
      ).length;

      // Scale with a scaling factor (2) to make it nicer
      scaleCanvas(false, (1 - (previousFingerSeparation / separation))/ 3, point);

      previousFingerSeparation = separation;
    }

    updateCoordinates();

    return;
  }

  if ((activeTool == "draw" || activeTool == "pencil") && path) {
    var step = event.delta / 2;
    step.angle += 90;
    if (activeTool == "draw") {
      var top = event.middlePoint + step;
      var bottom = event.middlePoint - step;
    } else if (activeTool == "pencil") {
      var top = event.middlePoint;
      bottom = event.middlePoint;
    }
    path.add(top);
    path.insert(0, bottom);
    path.smooth();
    view.draw();

    // Add data to path
    path_to_send.path.push({
      top: top,
      bottom: bottom
    });

    // Send paths every 100ms
    if (!timer_is_active) {

      send_paths_timer = setInterval(function() {

        socket.emit('draw:progress', room, uid, JSON.stringify(path_to_send));
        path_to_send.path = new Array();

      }, 100);

    }

    timer_is_active = true;
  } else if (activeTool == "select") {
    // Move item locally
    for (x in paper.project.selectedItems) {
      var item = paper.project.selectedItems[x];
      item.position += event.delta;
    }

    // Store delta
    if (paper.project.selectedItems) {
      if (!item_move_delta) {
        item_move_delta = event.delta;
      } else {
        item_move_delta += event.delta;
      }
    }

    // Send move updates every 50 ms
    if (!item_move_timer_is_active) {
      send_item_move_timer = setInterval(function() {
        if (item_move_delta) {
          var itemNames = new Array();
          for (x in paper.project.selectedItems) {
            var item = paper.project.selectedItems[x];
            itemNames.push(item._name);
          }
          socket.emit('item:move:progress', room, uid, itemNames, item_move_delta);
          item_move_delta = null;
        }
      }, 50);
    }
    item_move_timer_is_active = true;
  }
}



function onMouseUp(event) {

  // Ignore right mouse button clicks for now
  if (event.event.button == 2) {
    return;
  }

  // Pan - Middle click, click+shift or two finger touch for canvas moving
  if (event.event.button == 1 
      || (event.event.button == 0 && event.event.ctrlKey)
      || (event.event.touches && fingers == 2)) {
    $('#myCanvas').css('cursor', 'pointer');
    return;
  }

  clearInterval(mouseHeld);
  mouseHeld = undefined;

  if (activeTool == "draw" || activeTool == "pencil") {
    // Close the users path
    path.add(event.point);
    path.closed = true;
    path.smooth();
    view.draw();

    // Send the path to other users
    path_to_send.end = event.point;
    // This covers the case where paths are created in less than 100 seconds
    // it does add a duplicate segment, but that is okay for now.
    socket.emit('draw:progress', room, uid, JSON.stringify(path_to_send));
    socket.emit('draw:end', room, uid, JSON.stringify(path_to_send));

    // Stop new path data being added & sent
    clearInterval(send_paths_timer);
    path_to_send.path = new Array();
    timer_is_active = false;
  } else if (activeTool == "select") {
    // End movement timer
    clearInterval(send_item_move_timer);
    if (item_move_delta) {
      // Send any remaining movement info
      var itemNames = new Array();
      for (x in paper.project.selectedItems) {
        var item = paper.project.selectedItems[x];
        itemNames.push(item._name);
      }
      socket.emit('item:move:end', room, uid, itemNames, item_move_delta);
    } else {
      // delta is null, so send 0 change
      socket.emit('item:move:end', room, uid, itemNames, new Point(0, 0));
    }
    item_move_delta = null;
    item_move_timer_is_active = false;
  }

}

var key_move_delta;
var send_key_move_timer;
var key_move_timer_is_active = false;

function onKeyDown(event) {
  if (activeTool == "select") {
    var point = null;

    if (event.key == "up") {
      point = new paper.Point(0, -1);
    } else if (event.key == "down") {
      point = new paper.Point(0, 1);
    } else if (event.key == "left") {
      point = new paper.Point(-1, 0);
    } else if (event.key == "right") {
      point = new paper.Point(1, 0);
    }

    // Move objects 1 pixel with arrow keys
    if (point) {
      moveItemsBy1Pixel(point);
    }

    // Store delta
    if (paper.project.selectedItems && point) {
      if (!key_move_delta) {
        key_move_delta = point;
      } else {
        key_move_delta += point;
      }
    }

    // Send move updates every 100 ms as batch updates
    if (!key_move_timer_is_active && point) {
      send_key_move_timer = setInterval(function() {
        if (key_move_delta) {
          var itemNames = new Array();
          for (x in paper.project.selectedItems) {
            var item = paper.project.selectedItems[x];
            itemNames.push(item._name);
          }
          socket.emit('item:move:progress', room, uid, itemNames, key_move_delta);
          key_move_delta = null;
        }
      }, 100);
    }
    key_move_timer_is_active = true;
  }
}



function onKeyUp(event) {
  if (event.key == "delete") {
    // Delete selected items
    var items = paper.project.selectedItems;
    if (items) {
      for (x in items) {
        var item = items[x];
        socket.emit('item:remove', room, uid, item.name);
        item.remove();
        view.draw();
      }
    }
  }

  if (activeTool == "select") {
    // End arrow key movement timer
    clearInterval(send_key_move_timer);
    if (key_move_delta) {
      // Send any remaining movement info
      var itemNames = new Array();
      for (x in paper.project.selectedItems) {
        var item = paper.project.selectedItems[x];
        itemNames.push(item._name);
      }
      socket.emit('item:move:end', room, uid, itemNames, key_move_delta);
    } else {
      // delta is null, so send 0 change
      socket.emit('item:move:end', room, uid, itemNames, new Point(0, 0));
    }
    key_move_delta = null;
    key_move_timer_is_active = false;
  }
}



function moveItemsBy1Pixel(point) {
  if (!point) {
    return;
  }

  if (paper.project.selectedItems.length < 1) {
    return;
  }

  // Move locally
  var itemNames = new Array();
  for (x in paper.project.selectedItems) {
    var item = paper.project.selectedItems[x];
    item.position += point;
    itemNames.push(item._name);
  }

  // Redraw screen for item position update
  view.draw();
}

// Drop image onto canvas to upload it
$('#myCanvas').bind('dragover dragenter', function(e) {
  e.preventDefault();
});

$('#myCanvas').bind('drop', function(e) {
  e = e || window.event; // get window.event if e argument missing (in IE)
  if (e.preventDefault) { // stops the browser from redirecting off to the image.
    e.preventDefault();
  }
  e = e.originalEvent;
  var dt = e.dataTransfer;
  var files = dt.files;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    uploadImage(file);
  }
});




// --------------------------------- 
// CONTROLS EVENTS

var $color = $('.colorSwatch:not(#pickerSwatch)');
$color.on('click', function() {

  $color.removeClass('active');
  $(this).addClass('active');
  $('#activeColorSwatch').css('background-color', $(this).css('background-color'));
  update_active_color();

});

$('#pickerSwatch').on('click', function(event) {
  $('#mycolorpicker').toggle();
});
$('#settingslink').on('click', function() {
  $('#settings').fadeToggle();
});
$('#embedlink').on('click', function() {
  $('#embed').fadeToggle();
});
$('#importExport').on('click', function() {
  $('#importexport').fadeToggle();
});
$('#usericon').on('click', function() {
  $('#mycolorpicker').fadeToggle();
});
$('#clearCanvas').on('click', function() {
  clearCanvas();
  socket.emit('canvas:clear', room);
});
$('#exportSVG').on('click', function() {
  exportSVG();
});
$('#exportPNG').on('click', function() {
  exportPNG();
});

$('#pencilTool').on('click', function() {
  $('#editbar > ul > li > a').removeClass("selected"); // remove the backgrounds from other buttons
  $('#pencilTool > a').addClass("selected"); // set the selecttool css to show it as active
  activeTool = "pencil";
  $('#myCanvas').css('cursor', 'pointer');
  paper.project.activeLayer.selected = false;
});
$('#drawTool').on('click', function() {
  $('#editbar > ul > li > a').removeClass("selected"); // remove the backgrounds from other buttons
  $('#drawTool > a').addClass("selected"); // set the selecttool css to show it as active
  activeTool = "draw";
  $('#myCanvas').css('cursor', 'pointer');
  paper.project.activeLayer.selected = false;
});
$('#selectTool').on('click', function() {
  $('#editbar > ul > li > a').removeClass("selected"); // remove the backgrounds from other buttons
  $('#selectTool > a').addClass("selected");  // set the selecttool css to show it as active
  activeTool = "select";
  $('#myCanvas').css('cursor', 'default');
});

$('#zeroTool').on('click', function() {
  // Scroll back to 0,0
  view.scrollBy(new Point(- view.bounds.x, - view.bounds.y));
  updateCoordinates();
});

$('#scaleTool').on('click', function() {
  scaleCanvas(1);
});

$('#uploadImage').on('click', function() {
  $('#imageInput').click();
});

function clearCanvas() {
  // Remove all but the active layer
  if (project.layers.length > 1) {
    var activeLayerID = project.activeLayer._id;
    for (var i = 0; i < project.layers.length; i++) {
      if (project.layers[i]._id != activeLayerID) {
        project.layers[i].remove();
        i--;
      }
    }
  }

  // Remove all of the children from the active layer
  if (paper.project.activeLayer && paper.project.activeLayer.hasChildren()) {
    paper.project.activeLayer.removeChildren();
  }
  view.draw();
}

function exportSVG() {
  var svg = paper.project.exportSVG();
  encodeAsImgAndLink(svg);
}

// Encodes svg as a base64 text and opens a new browser window
// to the svg image that can be saved as a .svg on the users
// local filesystem. This skips making a round trip to the server
// for a POST.
function encodeAsImgAndLink(svg) {
  if ($.browser.msie) {
    // Add some critical information
    svg.setAttribute('version', '1.1');
    var dummy = document.createElement('div');
    dummy.appendChild(svg);
    window.winsvg = window.open('/static/html/export.html');
    window.winsvg.document.write(dummy.innerHTML);
    window.winsvg.document.body.style.margin = 0;
  } else {
    // Add some critical information
    svg.setAttribute('version', '1.1');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    var dummy = document.createElement('div');
    dummy.appendChild(svg);

    var b64 = Base64.encode(dummy.innerHTML);

    //window.winsvg = window.open("data:image/svg+xml;base64,\n"+b64);
    var html = "<img style='height:100%;width:100%;' src='data:image/svg+xml;base64," + b64 + "' />"
    window.winsvg = window.open();
    window.winsvg.document.write(html);
    window.winsvg.document.body.style.margin = 0;
  }
}

// Encodes png as a base64 text and opens a new browser window
// to the png image that can be saved as a .png on the users
// local filesystem. This skips making a round trip to the server
// for a POST.
function exportPNG() {
  var canvas = document.getElementById('myCanvas');
  var html = "<img src='" + canvas.toDataURL('image/png') + "' />"
  if ($.browser.msie) {
    window.winpng = window.open('/static/html/export.html');
    window.winpng.document.write(html);
    window.winpng.document.body.style.margin = 0;
  } else {
    window.winpng = window.open();
    window.winpng.document.write(html);
    window.winpng.document.body.style.margin = 0;
  }

}

// User selects an image from the file browser to upload
$('#imageInput').bind('change', function(e) {
  // Get selected files
  var files = document.getElementById('imageInput').files;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    uploadImage(file);
  }
});

function uploadImage(file) {
  var reader = new FileReader();

  //attach event handler
  reader.readAsDataURL(file);
  $(reader).bind('loadend', function(e) {
    var bin = this.result;

    //Add to paper project here
    var raster = new Raster(bin);
    raster.position = view.center;
    raster.name = uid + ":" + (++paper_object_count);
    socket.emit('image:add', room, uid, JSON.stringify(bin), raster.position, raster.name);
  });
}




// --------------------------------- 
// SOCKET.IO EVENTS
socket.on('settings', function(settings) {
  processSettings(settings);
});


socket.on('draw:progress', function(artist, data) {
  // It wasnt this user who created the event
  if (artist !== uid && data) {
    progress_external_path(JSON.parse(data), artist);
  }

});

socket.on('draw:end', function(artist, data) {

  // It wasnt this user who created the event
  if (artist !== uid && data) {
    end_external_path(JSON.parse(data), artist);
  }

});

socket.on('draw:mousemove', function(artist, data, username, color) {
  if (artist !== uid && data) {
    show_pointer(JSON.parse(data), artist, username, color);
  }
})

socket.on('user:connect', function(user_count) {
  console.log("user:connect");
  update_user_count(user_count);
});

socket.on('user:disconnect', function(user_count) {
  update_user_count(user_count);
});

socket.on('project:load', function(json) {
  console.log("project:load");
  paper.project.activeLayer.remove();
  paper.project.importJSON(json.project);

  // Make color selector draggable
  $('#mycolorpicker').pep({});
  // Make sure the range event doesn't propogate to pep
  $('#opacityRangeVal').on('touchstart MSPointerDown mousedown', function(ev) {
    ev.stopPropagation();
  }).on('change', function(ev) {
    update_active_color();
  })

  view.draw();
  $.get("../static/images/wheel.png");
});

socket.on('project:load:error', function() {
  $('#lostConnection').show();
});

socket.on('canvas:clear', function() {
  clearCanvas();
});

socket.on('loading:start', function() {
  // console.log("loading:start");
  $('#loading').show();
});

socket.on('loading:end', function() {
  $('#loading').hide();
  $('#colorpicker').farbtastic(pickColor); // make a color picker
  // cake
  $('#canvasContainer').css("background-image", 'none');

});

socket.on('item:remove', function(artist, name) {
  if (artist != uid && paper.project.activeLayer._namedChildren[name][0]) {
    paper.project.activeLayer._namedChildren[name][0].remove();
    view.draw();
  }
});

socket.on('item:move', function(artist, itemNames, delta) {
  if (artist != uid) {
    for (x in itemNames) {
      var itemName = itemNames[x];
      if (paper.project.activeLayer._namedChildren[itemName][0]) {
        paper.project.activeLayer._namedChildren[itemName][0].position += new Point(delta[1], delta[2]);
      }
    }
    view.draw();
  }
});

socket.on('image:add', function(artist, data, position, name) {
  if (artist != uid) {
    var image = JSON.parse(data);
    var raster = new Raster(image);
    raster.position = new Point(position[1], position[2]);
    raster.name = name;
    view.draw();
  }
});


console.log(view);

// --------------------------------- 
// SOCKET.IO EVENT FUNCTIONS

// Updates the active connections
var $user_count = $('#online_count');

function update_user_count(count) {  
  $user_count.text((count === 1) ? "1" : " " + count);
}

var external_paths = {};

// Ends a path
var end_external_path = function(points, artist) {

  var path = external_paths[artist];

  if (path) {

    // Close the path
    path.add(new Point(points.end[1], points.end[2]));
    path.closed = true;
    path.smooth();
    view.draw();

    // Remove the old data
    external_paths[artist] = false;

  }

};

var pointers = {};
var hidePointer;
var show_pointer = function(point, artist, username, color) {
  if(pointers[artist]) {
      move_pointer(point, artist);
  } else {
    add_pointer(point, artist, username, color);
  }
};

var move_pointer = function(point, artist) {
  var sel = "#pointer" + artist;
  var str = "translate(" + point[1] + "px," + point[2] + "px)";
  $(sel).css('-webkit-transform', str);
  $(sel).css('visibility', 'visible');
  if(hidePointer) {
    clearTimeout(hidePointer);
  }

  hidePointer = setTimeout(function(){ 
    // $(sel).css('visibility', 'hidden'); 
  }, 1000);
}

var add_pointer = function(point, artist, username, color) {
  var pointer = {
    "id": artist,
    "color": color
  };

  $("#pointers").append("<div class='pointer' id=pointer" + artist + " style='background-color:" + pointer.color + ";'><span class='username'>" + username + "</span></div>");
  pointers[artist] = pointer;
  move_pointer(point, artist);
}

// Continues to draw a path in real time
progress_external_path = function(points, artist) {

  var path = external_paths[artist];

  // The path hasnt already been started
  // So start it
  if (!path) {

    // Creates the path in an easy to access way
    external_paths[artist] = new Path();
    path = external_paths[artist];

    // Starts the path
    var start_point = new Point(points.start[1], points.start[2]);
    var color = new RgbColor(points.rgba.red, points.rgba.green, points.rgba.blue, points.rgba.opacity);
    if (points.tool == "draw") {
      path.fillColor = color;
    } else if (points.tool == "pencil") {
      path.strokeColor = color;
      path.strokeWidth = 2;
    }

    path.name = points.name;
    path.add(start_point);

  }

  // Draw all the points along the length of the path
  var paths = points.path;
  var length = paths.length;
  for (var i = 0; i < length; i++) {

    path.add(new Point(paths[i].top[1], paths[i].top[2]));
    path.insert(0, new Point(paths[i].bottom[1], paths[i].bottom[2]));

  }

  path.smooth();
  view.draw();

};

function processSettings(settings) {

  $.each(settings, function(k, v) {

    // Handle tool changes
    if (k === "tool") {
      $('.buttonicon-' + v).click();
    }

  })

}

// Periodically save drawing
setInterval(function(){
  saveDrawing();
}, 1000);

function saveDrawing(){
  var canvas = document.getElementById('myCanvas');
  // Save image to localStorage
  localStorage.setItem("drawingPNG"+room, canvas.toDataURL('image/png'));
}
