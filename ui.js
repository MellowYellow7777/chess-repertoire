var UIState = (() => {

  function UIState(gamestate, input) {
    var ui = {};
    ui.gamestate = gamestate;
    ui.hovering = -1;
    ui.grabbing = -1;
    ui.selected = -1;
    ui.leftFrom = -1;
    ui.rightFrom = -1;
    ui.wasSelected = false;
    ui.moves = [];
    ui.premoves = [];
    ui.position = Position();
    Position.copyTo(ui.gamestate.position, ui.position);
    ui.promotions = [];
    ui.userAnnotations = [];
    ui.noteAnnotations = [];
    ui.hint = -1;
    ui.promoting = -1;
    ui.mouse = input.mouse;
    ui.flipBoard = false;
    initializeInput(ui);
    return ui;
  }

  var HIGHLIGHT       = 'rgba(235, 97, 80, 0.8)';
  var HIGHLIGHT_SHIFT = 'rgba(172, 206, 89, 0.8)';
  var HIGHLIGHT_CTRL  = 'rgba(255, 170, 0, 0.8)';
  var HIGHLIGHT_ALT   = 'rgba(82, 176, 220, 0.8)';
  var HIGHLIGHT_META  = 'rgba(196, 114, 255, 0.8)';

  var ARROW           = 'rgba(255, 170, 0, 0.8)';
  var ARROW_SHIFT     = 'rgba(172, 206, 89, 0.8)';
  var ARROW_CTRL      = 'rgba(235, 97, 80, 0.8)';
  var ARROW_ALT       = 'rgba(82, 176, 220, 0.8)';
  var ARROW_META      = 'rgba(196, 114, 255, 0.8)';

  function initializeInput(ui) {

    var state = ui.gamestate;
    var mouse = ui.mouse;

    input.onLeftDown = function() {
      if (mouse.left && mouse.middle) return;
      ui.promoting = -1;
      ui.userAnnotations.length = 0;
      if (ui.selected > -1) {
        if (makeMove(ui)) return;
      }
      var piece = ui.position.board[ui.hovering];
      if (piece) {
        var selection = ui.hovering;
        ui.leftFrom = selection;
        ui.grabbing = selection;
        ui.wasSelected = ui.selected === selection;
        select(ui, selection);
      } else {
        deselect(ui);
      }
    }

    input.onLeftUp = function() {
      if (mouse.left || mouse.middle) return;
      if (ui.grabbing > -1) {
        ui.grabbing = -1;
        if (makeMove(ui)) return;
        if (ui.hovering === ui.leftFrom && ui.wasSelected) {
          deselect(ui);
        }
      }
    }

    input.onMiddleDown = input.onLeftDown;
    input.onMiddleUp = input.onLeftUp;

    input.onRightDown = function() {
      if (ui.grabbing > -1) {
        deselect(ui);
        ui.grabbing = -1;
      } else if (ui.premoves.length) {
        ui.premoves.length = 0;
        Position.copyTo(ui.gamestate.position, ui.position);
      } else {
        ui.rightFrom = ui.hovering;
      }
    }

    input.onRightUp = function(event) {
      if (ui.rightFrom === -1) return;
      var from = ui.rightFrom;
      var to = ui.hovering;
      var color = getColor(from, to, event);
      addUserAnnotation(ui,from,to,color);
      ui.rightFrom = -1;
    }

    input.onMouseMove = function() {
      var tx = Math.floor(mouse.x / CELL_SIZE);
      var ty = Math.floor(mouse.y / CELL_SIZE);
      tx = Math.max(0, Math.min(7, tx));
      ty = Math.max(0, Math.min(7, ty));
      tx = ui.flipBoard ? 7 - tx : tx;
      ty = ui.flipBoard ? ty : 7 - ty;
      ui.hovering = ty << 3 | tx;
    }

    var htmlElement = document.html

    input.onKeyDown = function(event) {
      if (document.activeElement !== document.body) return;
      switch (event.code) {

        case 'ArrowLeft':
          deselect(ui);
          if (event.ctrlKey) GameState.start(state);
          else if (event.altKey) GameState.jumpBackToVariation(state);
          else GameState.back(state);
          Position.copyTo(ui.gamestate.position, ui.position);
          renderMoves(state);
          break;

        case 'ArrowRight':
          deselect(ui);
          if (event.ctrlKey) GameState.end(state);
          else if (event.altKey) GameState.jumpForwardToVariation(state);
          else GameState.forward(state);
          Position.copyTo(ui.gamestate.position, ui.position);
          renderMoves(state);
          break;

        case 'ArrowUp': 
          deselect(ui);
          GameState.backVariation(state); 
          Position.copyTo(ui.gamestate.position, ui.position);
          renderMoves(state);
          break;

        case 'ArrowDown':
          deselect(ui);
          GameState.forwardVariation(state); 
          Position.copyTo(ui.gamestate.position, ui.position);
          renderMoves(state);
          break;

        case 'KeyF':
          ui.flipBoard = !ui.flipBoard;
          if (ui.flipBoard) {
            document.documentElement.style.setProperty("--db-bar-direction","row-reverse");
          } else {
            document.documentElement.style.setProperty("--db-bar-direction","row");
          }
          break;
      }
    }
  }

  function makeMove(ui) {
    var i = 0;
    var l = ui.moves.length;
    var data, to;
    for (; i < l; i++) {
      data = ui.moves[i];
      to = data.x | data.y << 3; // Square.fromXY(x,y)
      if (to !== ui.hovering) continue;
      if (opponent === SELF || ui.gamestate.position.turn === playerColor) {
        var moves = ui.gamestate.moves;
        var i = ui.gamestate.movePtr;
        var l = i + ui.gamestate.moveLen;
        var match = false;
        for (; i < l; i++) {
          if (moves[i] === data.move) {
            match = true;
            break;
          }
        }
        if (match) {
          GameState.makeMove(ui.gamestate, data.move);
          renderMoves(ui.gamestate);
          Position.copyTo(ui.gamestate.position, ui.position);
        }
        deselect(ui);
        if (opponent === PLAYER && socket) socket.send(JSON.stringify({
          type: 'move',
          move: data.move,
        }));
        if (opponent === STOCKFISH) {
          if (state.moveLen === 0) return;
          makeBotMove(state.fen);
        } else if (opponent === TRAINING) {
          showHint = Infinity;
          makeTrainingMove(state);
        }
        return true;
      } else {
        Position.makeMove(ui.position, data.move);
        ui.position.turn = playerColor;
        deselect(ui);
        ui.grabbing = -1;
        ui.premoves.push(data);
        audio.play('premove');
        return true;
      }
    }
    i = 0;
    l = ui.promotions.length;
    var promotion, x, y;
    for (; i < l; i++) {
      promotion = ui.promotions[i];
      data = promotion[0];
      x = data.x;
      y = data.y;
      to = x | y << 3; // Square.fromXY(x,y)
      if (to !== ui.hovering) continue;
      ui.moves.length = 0;
      var j = 0, move;
      for (; j < 4; j++) {
        data = promotion[j];
        move = data.move;
        var prom = move >> 26; // Move.getProm(move);
        var capture = move << 13 >> 25; // Move.getCapture(move)
        capture = capture !== -1; // capture !== Square.NULL
        if (y === 7) {
          ui.moves.push({move,x,y:2+prom,capture,promote:true});
        } else if (y === 0) {
          ui.moves.push({move,x,y:5-prom,capture,promote:true});
        }
      }
      ui.promotions.length = 0;
      ui.promoting = ui.grabbing;
      ui.grabbing = -1;
      return true;
    }
    return false;
  }

  function deselect(ui) {
    ui.selected = -1;
    ui.moves.length = 0;
    ui.promotions.length = 0;
  }

  function select(ui, selection) {
    ui.selected = selection;
    var moves = ui.moves;
    var promotions = ui.promotions;
    moves.length = 0;
    promotions.length = 0;
    if (selection === -1) return;
    var gamestate = ui.gamestate;
    var piece = ui.position.board[selection];
    if (piece === 0) return;
    var moveArr, i, l;
    if (opponent === TRAINING) {
      if (gamestate.position.turn === playerColor) {
        moveArr = state.current.children.map(edge => edge.move);
        i = 0;
        l = moveArr.length;
      } else {
        moveArr = Premoves(ui.position, selection);
        i = 0;
        l = moveArr.length;
      }
    } else if (opponent === SELF || gamestate.position.turn === playerColor) {
      moveArr = gamestate.moves;
      i = gamestate.movePtr;
      l = i + gamestate.moveLen;
    } else {
      moveArr = Premoves(ui.position, selection);
      i = 0;
      l = moveArr.length;
    }
    var move;
    for (; i < l; i++) {
      move = moveArr[i];
      var from = move & 63; // Move.getFrom(move);
      if (from !== selection) continue;
      var to = move >> 6 & 63; // Move.getTo(move);
      var x = to & 7; // Square.getX(to);
      var y = to >> 3; // Square.getY(to);
      var capture = move << 13 >> 25; // Move.getCapture(move)
      capture = capture !== -1; // capture !== Square.NULL
      var prom = move >> 26; // Move.getProm(move);
      if (prom !== 0) {
        var j = 0;
        var m = promotions.length;
        var p, q;
        var match = false;
        for (; j < m; j++) {
          p = promotions[j];
          q = p[0];
          if (from === q.from
           && to === q.to) {
            p.push({move,from,to,x,y,capture,promote:false});
            match = true;
            break;
          }
        }
        if (!match) promotions.push([{move,from,to,x,y,capture,promote:false}]);
      } else {
        moves.push({move,x,y,capture,promote:false});
      }
    }
  }

  function addUserAnnotation(ui,from,to,color) {
    var annotations = ui.userAnnotations;
    var i = 0;
    var l = annotations.length;
    var annotation;
    var match = false;
    for (; i < l; i++) {
      annotation = annotations[i];
      if (annotation.from !== from) continue;
      if (annotation.to !== to) continue;
      match = true;
      if (annotation.color === color) {
      /*if (annotation.type === 'square') annotation.type = 'circle';
        else*/annotations.splice(i, 1);
      } else {
        annotation.color = color;
      }
      break;
    }
    if (!match) {
      if (from === to) annotations.unshift({type: 'square', from, to, color});
      else annotations.push({type: 'arrow', from, to, color});
    }
  }

  function getColor(from,to,event) {
    if (from === to) {
      if (event.ctrlKey + event.altKey + event.shiftKey > 1) return HIGHLIGHT_META;
      if (event.shiftKey) return HIGHLIGHT_SHIFT;
      if (event.ctrlKey) return HIGHLIGHT_CTRL;
      if (event.altKey) return HIGHLIGHT_ALT;
      if (event.metaKey) return HIGHLIGHT_META;
      return HIGHLIGHT;
    } else {
      if (event.ctrlKey + event.altKey + event.shiftKey > 1) return HIGHLIGHT_META;
      if (event.shiftKey) return ARROW_SHIFT;
      if (event.ctrlKey) return ARROW_CTRL;
      if (event.altKey) return ARROW_ALT;
      if (event.metaKey) return ARROW_META;
      return ARROW;
    }
  }

  UIState.HIGHLIGHT         = HIGHLIGHT;
  UIState.HIGHLIGHT_SHIFT   = HIGHLIGHT_SHIFT;
  UIState.HIGHLIGHT_CTRL    = HIGHLIGHT_CTRL;
  UIState.HIGHLIGHT_ALT     = HIGHLIGHT_ALT;
  UIState.HIGHLIGHT_META    = HIGHLIGHT_META;
  UIState.ARROW             = ARROW;
  UIState.ARROW_SHIFT       = ARROW_SHIFT;
  UIState.ARROW_CTRL        = ARROW_CTRL;
  UIState.ARROW_ALT         = ARROW_ALT;
  UIState.ARROW_META        = ARROW_META;

  UIState.initializeInput   = initializeInput;
  UIState.makeMove          = makeMove;
  UIState.deselect          = deselect;
  UIState.select            = select;
  UIState.addUserAnnotation = addUserAnnotation;
  UIState.getColor          = getColor;

  return UIState;

})();