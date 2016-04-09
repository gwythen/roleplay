

// var tiles = new Image();
// var c = document.getElementById("mat");
// tiles.src = "http://i.imgur.com/Aqv0Zwh.png";

// var drawnTiles = [];

// for (var i=0;i<100;i++) {
//    drawnTiles[i] = [];
// }

// $("#mat").on("click", function() {
//   coords = c.relMouseCoords(event);
//   canvasX = coords.x;
//   canvasY = coords.y;
//   console.log(canvasX);
//   console.log(canvasY);

//   drawElement(c, canvasX, canvasY, blockW, blockH);
// });

// drawGrid();


// function drawGrid() {
//   grid('diamonds', 30, 18, 800, 800);
// }

// function grid(type, w, h, totalW, totalH) {

//   var $this = this;
//   this.type = type || 'blocks'; // blocks, diamonds, hexagons
//   this.blockW = w || 25;
//   this.blockH = h || 25;
//   var c = document.getElementById("mat");
//   c.width = totalW;
//   c.height = totalH;

//   var totalW = totalW || $(document).width();
//   var totalH = totalH || $(document).height();

//   var mapGridCanvas = c.getContext("2d");
//   mapGridCanvas.clearRect(0, 0, c.width, c.height);
//   mapGridCanvas.globalAlpha = 1;
//   mapGridCanvas.strokeStyle = "#1e1e1e";
//   mapGridCanvas.lineWidth = 1;
//   mapGridCanvas.beginPath();
//   var x = 0;
//   var y = 0;
//   var z = 0;
//   var counter = 0;
//   for (var i = 0; i < Math.round(totalH / blockH); i++) {

//     var z = counter;
//     while (x <= blockW * Math.round(totalW / blockW)) {

//       if (z % 2 == 0) {
//         mapGridCanvas.moveTo(x, y + blockH);
//         mapGridCanvas.lineTo(x + blockW, y);
//       } else {
//         mapGridCanvas.moveTo(x, y);
//         mapGridCanvas.lineTo(x + blockW, y + blockH);
//       }

//       x += blockW;
//       z += 1;
//     }

//     x = 0;
//     y = y + blockH;
//     counter += 1;

//   }

//   mapGridCanvas.stroke();
// };

// function drawElement(canvas, canvasX, canvasY, blockW, blockH) {    
//   var currCol = Math.ceil(canvasX / (blockW)) -1;
//   var currRow = Math.ceil(canvasY / (blockH)) -1;
//   var tiles = [];
//   if((currCol - currRow) % 2 == 0) {
//     //Up edge. In this case it's either the tile up and before
//     //console.log("up");
//     tiles.push(getTile(blockW, blockH, currCol, currRow));
//     tiles.push(getTile(blockW, blockH, currCol - 1, currRow - 1));
//   } else {    
//     //console.log("down");
//     tiles.push(getTile(blockW, blockH, currCol -1, currRow));
//     tiles.push(getTile(blockW, blockH, currCol, currRow - 1));
//   }
  
//   var point = [canvasX, canvasY];
//   for(i = 0; i < tiles.length; i++) {
//     if(inside(point, tiles[i].coords)) {
//       console.log("found in tile " + tiles[i].column + " " + tiles[i].row);
//       console.log(tiles[i]);
//       drawTilePic(tiles[i], canvas);
//       break;
//     }
//   };
// }

// // function drawTile(tile, canvas) {
// //   var ctx = canvas.getContext("2d");
// //   ctx.globalAlpha = 1;
// //   ctx.strokeStyle = "#1e1e1e";
// //   ctx.lineWidth = 1;
// //   ctx.beginPath();
// //   console.log("here");
// //   ctx.moveTo(tile.leftCornerX, tile.leftCornerY);
// //   //console.log("left corner " + leftCornerX + " " + leftCornerY);
// //   ctx.lineTo(tile.topCornerX, tile.topCornerY);
// //   //console.log("top corner " + topCornerX + " " + topCornerY);
// //   ctx.lineTo(tile.rightCornerX, tile.rightCornerY);
// //   //console.log("right corner " + rightCornerX + " " + rightCornerY);
// //   ctx.lineTo(tile.bottomCornerX, tile.bottomCornerY);
// //   //console.log("bottom corner " + bottomCornerX + " " + bottomCornerY);
// //   ctx.closePath();
// //   //console.log("left corner " + leftCornerX + " " + leftCornerY);
// //   //ctx.fill();
// // }

// function drawTilePic(tile, canvas) {
// var ctx = canvas.getContext("2d");
//   var tilex= 7*42;
//   var tiley = 5;
//   var tilew = 42;
//   var tileh = 27;
//   var canvastilew = tile.rightCornerX - tile.leftCornerX;
//   var canvastileh = tile.bottomCornerY - tile.topCornerY;
  
//   //need to check if to draw behind or before the nearby cells
 
//   //ctx.globalCompositeOperation='destination-over';
  
//   //redraw the canvas
//   drawGrid();
  
//   //add tile to the list of drawn tiles  
//   drawnTiles[tile.row][tile.column] = tile;
 
//   for(i=0; i< drawnTiles.length; i++) {
//    console.log(drawnTiles.length);
//     for(j = 0; j<drawnTiles[i].length; j++) {
//     console.log(drawnTiles[i].length);
//       var currtile = drawnTiles[i][j];
//       if(currtile) {
//           ctx.drawImage(tiles, tilex, tiley, tilew, tileh, currtile.leftCornerX, currtile.topCornerY -10, canvastilew, canvastileh + 10);
//       }
//     }
//   }
// }

// function getTile(blockW, blockH, column, row) {
//   var tile = {};
//   tile.column = column;
//   tile.row = row;
//   if(column % 2 == 0) {
//     baseH = 0;
//   } else {
//     baseH = blockH;
//   }
//   tile.leftCornerX = blockW*column;
//   tile.topCornerY = blockH*row;
//   tile.topCornerX = tile.bottomCornerX = tile.leftCornerX + blockW;
//   tile.bottomCornerY = tile.topCornerY + 2*blockH;
//   tile.leftCornerY = tile.rightCornerY = tile.topCornerY + blockH;
//   tile.rightCornerX = tile.leftCornerX + 2*blockW;
//  console.log("col " + column);
//  console.log("row " + row);
//  console.log(tile);
  
//   tile.coords = [[tile.leftCornerX, tile.leftCornerY], [tile.topCornerX, tile.topCornerY], [tile.rightCornerX, tile.rightCornerY], [tile.bottomCornerX, tile.bottomCornerY]];
//   return tile;
// }

// function relMouseCoords(event) {
//   var totalOffsetX = 0;
//   var totalOffsetY = 0;
//   var canvasX = 0;
//   var canvasY = 0;
//   var currentElement = this;

//   do {
//     totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
//     totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
//   }
//   while (currentElement = currentElement.offsetParent)

//   canvasX = event.pageX - totalOffsetX;
//   canvasY = event.pageY - totalOffsetY;

//   return {
//     x: canvasX,
//     y: canvasY
//   }
// }

// HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

// function inside(point, vs) {
//     // ray-casting algorithm based on
//     // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//     // array of coordinates of each vertex of the polygon
//     //var polygon = [ [ 1, 1 ], [ 1, 2 ], [ 2, 2 ], [ 2, 1 ] ];
//     //inside([ 1.5, 1.5 ], polygon); // true
    
//     var x = point[0], y = point[1];

//     var inside = false;
//     for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
//         var xi = vs[i][0], yi = vs[i][1];
//         var xj = vs[j][0], yj = vs[j][1];

//         var intersect = ((yi > y) != (yj > y))
//             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
//         if (intersect) inside = !inside;
//     }

//     return inside;
// };


var canvas = document.getElementById("mat");
var tiles = new Image();
tiles.src = "http://i.imgur.com/Aqv0Zwh.png";
var tileW = 25;
var tileH = 25;
var gridSize = 13;
var leftOffset = 7;
var topOffset = -6;

var tilesMap = [];

for (var i=0;i<gridSize;i++) {
   tilesMap[i] = [];
}

drawGrid(leftOffset, topOffset);
$("#mat").on("click", function(event) {
  coords = canvas.relMouseCoords(event);
  canvasX = coords.x;
  canvasY = coords.y;
  var tilecoords = getTileCoordinates(isoTo2D(coords), tileH);
  
  if(tilecoords.y - topOffset >= 0 && tilecoords.y - topOffset <= gridSize) {
    if(tilecoords.x - leftOffset >= 0 && tilecoords.x - leftOffset <= gridSize) {
      drawImage(tilecoords);
     }
  }
  
});


function drawImage(tile) {
  var tilex = 7 * 42;
  var tiley = 5;
  var tilew = 42;
  var tileh = 27;


  //redraw the canvas
  drawGrid(leftOffset, topOffset);
  
  //add tile to the list of drawn tiles  
  tilesMap[tile.y - topOffset][tile.x - leftOffset] = tile;
  console.log(tile.y - topOffset);
  console.log(tile.x - leftOffset);
  for(i=0; i< tilesMap.length; i++) {
   //console.log(tilesMap.length);
    for(j = 0; j<tilesMap[i].length; j++) {
   // console.log(tilesMap[i].length);
      var currtile = tilesMap[i][j];
      if(currtile) {
        var tileBottomLeft = {
          x: currtile.x * tileH,
          y: (currtile.y + 1) * tileW
        };
        var point = twoDToIso(tileBottomLeft);
        var ctx = canvas.getContext("2d");
          ctx.drawImage(tiles, tilex, tiley, tilew, tileh, point.x - 2, point.y - 18, 50, 32);
      }
    }
  } 
}


function drawGrid(leftOffset, topOffset) {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var col = 0; col < gridSize; col++) {
    for (var row = 0; row < gridSize; row++) {
      drawTile(col + leftOffset, row + topOffset, "#1e1e1e");
    }
  }
}

function drawTile(col, row, color) {
  var tile = getTile(tileW, tileH, col, row);
  var ctx = canvas.getContext("2d");
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  ctx.moveTo(tile.topLeft.x, tile.topLeft.y);
  ctx.lineTo(tile.topRight.x, tile.topRight.y);
  ctx.lineTo(tile.bottomRight.x, tile.bottomRight.y);
  ctx.lineTo(tile.bottomLeft.x, tile.bottomLeft.y);
  ctx.closePath();
  ctx.stroke();
}

function getTile(width, height, col, row) {
  var tile = {};
  var topLeft = {
    x: col * width,
    y: row * height
  };
  var topRight = {
    x: (col + 1) * width,
    y: row * height
  };
  var bottomLeft = {
    x: col * width,
    y: (row + 1) * height
  };
  var bottomRight = {
    x: (col + 1) * width,
    y: (row + 1) * height
  };

  tile.topLeft = twoDToIso(topLeft);
  tile.topRight = twoDToIso(topRight);
  tile.bottomLeft = twoDToIso(bottomLeft);
  tile.bottomRight = twoDToIso(bottomRight);
  return tile;
}


/**
 * convert an isometric point to 2D
 * */
function isoTo2D(pt) {
  //gx=(2*isoy+isox)/2;
  //gy=(2*isoy-isox)/2
  var tempPt = {};
  tempPt.x = (2 * pt.y + pt.x) / 2;
  tempPt.y = (2 * pt.y - pt.x) / 2;
  return tempPt;
}

/**
 * convert a 2d point to isometric
 * */
function twoDToIso(pt) {
  //gx=(isox-isoxy;
  //gy=(isoy+isox)/2
  var tempPt = {};
  tempPt.x = pt.x - pt.y;
  tempPt.y = (pt.x + pt.y) / 2;
  return tempPt;
}

/**
 * convert a 2d point to specific tile row/column
 * */
function getTileCoordinates(pt, tileHeight) {
  var tempPt = {};
  tempPt.x = Math.floor(pt.x / tileHeight);
  tempPt.y = Math.floor(pt.y / tileHeight);

  return tempPt;
}

/**
 * convert specific tile row/column to 2d point
 * */
function get2dFromTileCoordinates(pt, tileHeight) {
  var tempPt = {};
  tempPt.x = pt.x * tileHeight;
  tempPt.y = pt.y * tileHeight;

  return tempPt;
}


function relMouseCoords(event) {
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while (currentElement = currentElement.offsetParent)

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  return {
    x: canvasX,
    y: canvasY
  }
}

HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
