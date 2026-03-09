var Renderer = (() => {

  var Renderer = {};

  function drawBoard(ctx,config) {
    ctx.fillStyle = config.darkSquares;
    ctx.fillRect(0,0,BOARD_SIZE,BOARD_SIZE);
    ctx.fillStyle = config.lightSquares;
    for (var i = 0; i < 32; i++) {
      var x = (i << 1 & 7);
      var y = (i >> 2);
      x += (x + y) % 2;
      ctx.fillRect(x*CELL_SIZE,y*CELL_SIZE,CELL_SIZE,CELL_SIZE)
    }
/*
    var img = images.board;
    ctx.drawImage(
      img,                    // image
      0, 0,                   // sx,sy
      img.width, img.height,  // sw,sh
      0, 0,                   // dx,dy
      BOARD_SIZE, BOARD_SIZE, // dw,dh
    );
*/
  }

  function drawPiece(ctx,piece,x,y,flip) {
    x = flip ? 7 - x : x;
    y = flip ? 7 - y : y;
    var img = images.piece[piece];
    if (!img) return;
    ctx.drawImage(
      img,                          // image
      0, 0,                         // sx,sy
      img.width, img.height,        // sw,sh
      CELL_SIZE * x, CELL_SIZE * y, // dx,dy
      CELL_SIZE, CELL_SIZE,         // dw,dh
    );
  }

  function drawPieceExact(ctx,piece,x,y) {
    var img = images.piece[piece];
    if (!img) return;
    var w = img.width;
    var h = img.height;
    var c2 = CELL_SIZE/2;
    ctx.drawImage(
      img,                  // image
      0, 0,                 // sx,sy
      w, h,                 // sw,sh
      x - c2, y - c2,       // dx,dy
      CELL_SIZE, CELL_SIZE, // dw,dh
    );
  }

  function drawPosition(ctx,ui,position) {
    var board = position.board;
    var flip = ui.flipBoard;
    var i = 0;
    var piece;
    var img;
    for (; i < 64; i++) {
      if (i === ui.grabbing) continue;
      if (i === ui.promoting) continue;
      piece = board[i];
      if (!piece) continue;
      drawPiece(ctx,piece, i & 7, 7 - (i >> 3),flip);
    }
    if (ui.grabbing > -1) {
      drawPieceExact(ctx,ui.position.board[ui.grabbing],ui.mouse.x,ui.mouse.y)
    }
  }

  function drawCoordinates(ctx,flip) {
    ctx.fillStyle = config.lightSquares;
    ctx.font = 'bold ' + (CELL_SIZE / 4) + 'px Arial';
    var c32 = CELL_SIZE/24;
    var files = flip ? 'hgfedcba' : 'abcdefgh';
    var ranks = flip ? '87654321' : '12345678';
    
    ctx.textAlign = 'right';
    ctx.fillText(files[0], CELL_SIZE*1 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[2], CELL_SIZE*3 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[4], CELL_SIZE*5 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[6], CELL_SIZE*7 - c32, CELL_SIZE*8 - c32);
    ctx.textAlign = 'left';
    var h = ctx.measureText('1').fontBoundingBoxAscent;
    ctx.fillText(ranks[0], c32, CELL_SIZE*7 + h + c32);
    ctx.fillText(ranks[2], c32, CELL_SIZE*5 + h + c32);
    ctx.fillText(ranks[4], c32, CELL_SIZE*3 + h + c32);
    ctx.fillText(ranks[6], c32, CELL_SIZE*1 + h + c32);
    ctx.fillStyle = config.darkSquares;
    ctx.textAlign = 'right';
    ctx.fillText(files[1], CELL_SIZE*2 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[3], CELL_SIZE*4 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[5], CELL_SIZE*6 - c32, CELL_SIZE*8 - c32);
    ctx.fillText(files[7], CELL_SIZE*8 - c32, CELL_SIZE*8 - c32);
    ctx.textAlign = 'left';
    ctx.fillText(ranks[1], c32, CELL_SIZE*6 + h + c32);
    ctx.fillText(ranks[3], c32, CELL_SIZE*4 + h + c32);
    ctx.fillText(ranks[5], c32, CELL_SIZE*2 + h + c32);
    ctx.fillText(ranks[7], c32, CELL_SIZE*0 + h + c32);
  }

  function drawMove(ctx,move,flip) {
    if (move.promote) return drawPromotion(ctx,move.x,move.y,flip);
    if (move.capture) return drawCapture(ctx,move.x,move.y,flip);
    var x = move.x;
    var y = move.y;
    ctx.fillStyle = '#0D080425';
    var cx = (flip ? 7 - x : x )*CELL_SIZE + CELL_SIZE/2;
    var cy = (flip ? y  : 7 - y)*CELL_SIZE + CELL_SIZE/2;
    ctx.fillStyle = '#0D080425';
    ctx.beginPath();
    var r = CELL_SIZE/6;
    ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  function drawCapture(ctx,x,y,flip) {
    ctx.fillStyle = '#0D080425';
    var cx = (flip ? 7 - x : x )*CELL_SIZE + CELL_SIZE/2;
    var cy = (flip ? y  : 7 - y)*CELL_SIZE + CELL_SIZE/2;
    ctx.fillStyle = '#0D080425';
    ctx.beginPath();
    var or = CELL_SIZE/2;
    var ir = .8*or;
    ctx.arc(cx,cy,or,0,2*Math.PI);
    ctx.arc(cx,cy,ir,0,2*Math.PI,true);
    ctx.closePath();
    ctx.fill();
  }

  function drawPromotion(ctx,x,y,flip) {
    ctx.fillStyle = 'white';
    x = flip ? 7 - x : x;
    y = flip ? y : 7 - y;
    ctx.fillRect(
      x * CELL_SIZE - 1, y * CELL_SIZE - 1, // dx,dy
      CELL_SIZE + 2, CELL_SIZE + 2,         // dw,dh
    );
    var piece;
    switch (y) { // y is flipped
      case 0: piece = +5; break; // piece = Piece.BQ
      case 1: piece = +4; break; // piece = Piece.BR
      case 2: piece = +3; break; // piece = Piece.BB
      case 3: piece = +2; break; // piece = Piece.BN
      case 4: piece = -2; break; // piece = Piece.WN
      case 5: piece = -3; break; // piece = Piece.WB
      case 6: piece = -4; break; // piece = Piece.WR
      case 7: piece = -5; break; // piece = Piece.WQ
    }
    drawPiece(ctx,piece,x,y,flip);
  }

  var promotions = [];

  function drawMoves(ctx,ui,config) {
    promotions.length = 0;
    var flip = ui.flipBoard
    if (config.showLegalMoves && opponent !== TRAINING) {
      var moves = ui.moves;
      var i = 0, l = moves.length;
      for (; i < l; i++) {
        var move = moves[i];
        if (move.promote) promotions.push(move);
        else drawMove(ctx,move,flip);
      }
    }
  }

  function drawPromotions(ctx,ui,config) {
      var moves = promotions;
      var i = 0, l = moves.length;
      for (; i < l; i++) drawMove(ctx,moves[i],ui.flipBoard);
  }

  function drawArrow(ctx,x0,y0,x1,y1) {
    x0 = (x0 + .5)*CELL_SIZE;
    y0 = (y0 + .5)*CELL_SIZE;
    x1 = (x1 + .5)*CELL_SIZE;
    y1 = (y1 + .5)*CELL_SIZE;
    var t = CELL_SIZE * .35;
    var w = CELL_SIZE * .1;
    var dx = x0 - x1;
    var dy = y0 - y1;
    var d = Math.sqrt(dx*dx + dy*dy);
    var bx = x0 - t/d * dx;
    var by = y0 - t/d * dy;
    var cx = x1 + t/d * dx;
    var cy = y1 + t/d * dy;

    var Px = dy/d;
    var Py = -dx/d;

    var P1x = cx + .75*t*Px;
    var P1y = cy + .75*t*Py;
    var P2x = cx - .75*t*Px;
    var P2y = cy - .75*t*Py;
    var B1x = bx + w*Px;
    var B1y = by + w*Py;
    var B2x = bx - w*Px;
    var B2y = by - w*Py;
    var C1x = cx + w*Px;
    var C1y = cy + w*Py;
    var C2x = cx - w*Px;
    var C2y = cy - w*Py;
    var D1x = 2*B1x - C1x;
    var D1y = 2*B1y - C1y;

    ctx.beginPath();

    ctx.moveTo(x1,y1);
    ctx.lineTo(P1x,P1y);
    ctx.lineTo(C1x,C1y);
    ctx.lineTo(B1x,B1y);
    ctx.lineTo(B2x,B2y);
    ctx.lineTo(C2x,C2y);
    ctx.lineTo(P2x,P2y);
    ctx.lineTo(x1,y1);

    ctx.fill();
    ctx.closePath();
  }

  function drawHighlights(ctx,highlights,flip) {
    var l = highlights.length;
    if (!l) return;
    var i = 0;
    var sq;
    var fx, fy;
    var tx, ty;
    var from, to;
    for (; i < l; i++) {
      highlight = highlights[i];
      from = highlight.from;
      to = highlight.to;
      fx = flip ? 7 - (from & 7) : from & 7;
      fy = flip ? from >> 3 : 7 - (from >> 3);
      ctx.fillStyle = highlight.color;
      switch (highlight.type) {
        case 'circle': /* thought this would look better
          var cx = fx*CELL_SIZE + CELL_SIZE/2;
          var cy = fy*CELL_SIZE + CELL_SIZE/2;
          ctx.beginPath();
          var or = CELL_SIZE/2;
          var ir = .8*or;
          ctx.arc(cx,cy,or,0,2*Math.PI);
          ctx.arc(cx,cy,ir,0,2*Math.PI,true);
          ctx.closePath();
          ctx.fill();
          break; */
        case 'square':
          ctx.fillRect(
            CELL_SIZE * fx, CELL_SIZE * fy, // dx,dy
            CELL_SIZE, CELL_SIZE,           // dw,dh
          );
          break;
        case 'arrow':
          tx = flip ? 7 - (to & 7) : to & 7;
          ty = flip ? to >> 3 : 7 - (to >> 3);
          drawArrow(ctx,fx,fy,tx,ty);
          break;
      }
    }
  }

  function drawMoveHighlight(ctx,move,config,flip) {
    var from = move & 63; // Move.getFrom(move);
    var to = move >> 6 & 63; // Move.getTo(move);
    fx = flip ? 7 - (from & 7) : from & 7;
    fy = flip ? from >> 3 : 7 - (from >> 3);
    tx = flip ? 7 - (to & 7) : to & 7;
    ty = flip ? to >> 3 : 7 - (to >> 3);
    ctx.fillStyle = config.moveHighlight;
    ctx.globalAlpha = .5;
    ctx.fillRect(
      CELL_SIZE * fx, CELL_SIZE * fy, // dx,dy
      CELL_SIZE, CELL_SIZE,           // dw,dh
    );
    ctx.fillRect(
      CELL_SIZE * tx, CELL_SIZE * ty, // dx,dy
      CELL_SIZE, CELL_SIZE,           // dw,dh
    );
    ctx.globalAlpha = 1;
  }

  function draw(ctx,state,ui,config) {
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    drawBoard(ctx,config);
    if (config.coordinates) drawCoordinates(ctx,ui.flipBoard);
    if (config.highlightMoves) {
      if (state.index > 0) {
        var node = state.line[state.index - 1];
        var edge = node.children[node.forwardIndex];
        drawMoveHighlight(ctx,edge.move,config,ui.flipBoard);
      }
    }
    if (opponent === TRAINING && performance.now() > showHint && ui.hint > -1) {
      drawHighlights(ctx, [{type: 'square', from: ui.hint, to: ui.hint, color: '#00ff0080'}],ui.flipBoard);
    }
    drawMoves(ctx,ui,config);
    drawPosition(ctx,ui,ui.position);
    drawHighlights(ctx,ui.userAnnotations,ui.flipBoard);
    drawHighlights(ctx,ui.noteAnnotations,ui.flipBoard);
    drawPromotions(ctx,ui,config);
  }

  Renderer.drawBoard         = drawBoard;
  Renderer.drawPiece         = drawPiece;
  Renderer.drawPieceExact    = drawPieceExact;
  Renderer.drawPosition      = drawPosition;
  Renderer.drawMove          = drawMove;
  Renderer.drawCapture       = drawCapture;
  Renderer.drawPromotion     = drawPromotion;
  Renderer.drawMoves         = drawMoves;
  Renderer.drawArrow         = drawArrow;
  Renderer.drawHighlights    = drawHighlights;
  Renderer.drawMoveHighlight = drawMoveHighlight;
  Renderer.draw              = draw;

  return Renderer;

})();