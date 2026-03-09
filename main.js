




var socket = null;

function connectToServer() {
  socket = new WebSocket('ws://localhost:8000');
  
  socket.onmessage = function(event) {
    console.log(event.data);
    message = JSON.parse(event.data);
    switch (message.type) {
      case 'gameStart':
        GameState.fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',state);
        playerColor = message.color;
        ui.flipBoard = playerColor === -1;
        opponent = PLAYER;
        audio.play('game-start');
        break;
      case 'move':
        if (state.fen === message.beforeFEN) {
        moveOpponent(message.move)
        } else if (state.fen !== message.afterFEN) {
          socket.send(JSON.stringify({
            type: 'sync',
          }));
        }
        break;
      case 'sync':
        //GameState.fromMoves(state, message.moves);
        break;
    }
  }

  socket.onerror = function() {
    socket = null;
  }

  socket.onclose = function() {
    socket = null;
  }
}

function moveOpponent(move) {
  GameState.makeMove(state,move);
  Position.copyTo(state.position, ui.position);

  if (ui.premoves.length) {

    var premove = ui.premoves.shift().move;
    var moveArr, i, l;
    if (opponent === TRAINING) {
      moveArr = state.current.children.map(edge => edge.move);
      i = 0;
      l = moveArr.length;
    } else {
      moveArr = state.moves;
      i = state.movePtr;
      l = i + state.moveLen;
    }

    var move;

    var from0 = premove & 63; // Move.getFrom(premove);
    var to0 = premove >> 6 & 63; // Move.getTo(premove);
    var capture0 = premove << 13 >> 25; // Move.getCapture(premove);
    var castle0 = premove << 6 >> 25; // Move.getCastle(premove);
    var prom0 = premove >> 26; // Move.getProm(premove);

    for (; i < l; i++) {
      move = moveArr[i];

      var from1 = move & 63; // Move.getFrom(premove);
      var to1 = move >> 6 & 63; // Move.getTo(premove);
      var capture1 = move << 13 >> 25; // Move.getCapture(premove);
      var castle1 = move << 6 >> 25; // Move.getCastle(premove);
      var prom1 = move >> 26; // Move.getProm(premove);

      if (!(from0 === from1 && to0 === to1 && prom0 === prom1)) continue;

      GameState.makeMove(ui.gamestate, move);
      Position.copyTo(ui.gamestate.position, ui.position);

      if (opponent === PLAYER && socket) socket.send(JSON.stringify({
        type: 'move',
        move,
      }));
      if (opponent === STOCKFISH) {
        if (state.moveLen === 0) return;
        makeBotMove(state.fen);
      } else if (opponent === TRAINING) {
        makeTrainingMove(state);
      }

      var i = 0;
      var l = ui.premoves.length;
      for (; i < l; i++) {
        Position.makeMove(ui.position, ui.premoves[i].move);
      }

      return;
    }

    ui.premoves.length = 0;
  } else {
    if (ui.selected) {
      var sel = ui.selected;
      UIState.deselect(ui);
      UIState.select(ui, sel);
    }
  }
}


var stockfish = null;

var postMessage = null;

function loadStockfish() {
  try {
    Stockfish().then(res => {
      stockfish = res;

      stockfish.addMessageListener(function(line) {
        console.log(line);
        getMessage(line);
      });

      postMessage = stockfish.postMessage;

      postMessage('setoption name Threads value 4');
      postMessage('uci');
      postMessage('isready');

      opponent = STOCKFISH;

    });
  } catch (error) {throw error}
}

function makeBotMove(fen) {
  postMessage('position fen ' + fen);
  postMessage('go movetime 1000');
}

var showHint = false;

function makeTrainingMove(state) {
  var edges = state.current.children;
  if (edges.length === 0) {
    setTimeout(() => {
      GameState.start(state);
      Position.copyTo(state.position, ui.position);
      renderMoves(state);
      edges = state.current.children;
      if (edges.length === 0) return;
      ui.hint = edges[0].move & 63;
      showHint = performance.now() + 5000;
    }, 1000);
    return;
  }
  var edge = edges[(Math.random() * edges.length) | 0];
  setTimeout(() => {
    moveOpponent(edge.move);
    renderMoves(state);
      edges = state.current.children;
      if (edges.length === 0) return;
      ui.hint = edges[0].move & 63;
      showHint = performance.now() + 5000;
  }, 1000);
}

function getMessage(line) {
  if (!line.startsWith('bestmove')) return;
  var move = line.split(' ')[1];
  var match = SAN.toMove(state.position, move, state.moves, state.movePtr, state.movePtr + state.moveLen);
  if (!move) throw Error(`invalid move: ${move}`);
  moveOpponent(match);
}

var wrapper = document.createElement('div');
wrapper.className = 'board-wrapper';

var canvas = document.createElement('canvas');
canvas.className = 'board';
var ctx = canvas.getContext('2d');
wrapper.appendChild(canvas);

function resizeContent() {
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var bs = Math.floor(BOARD_SIZE);
  var displayWidth = ww - 24 - bs;
  var notesHeight = wh - 92 - 36 - bs;
  var fenTop = BOARD_SIZE + 52 + 36;
  var db = dbOpen && opponent !== TRAINING ? dbheight : 42;
  nameBar.style.width = BOARD_SIZE + 'px';
  displayWrapper.style.width = displayWidth + 'px';
  fenBar.style.width = BOARD_SIZE + 'px';
  fenBar.style.top = fenTop + 'px';
  notes.style.width = BOARD_SIZE + 'px';
  notes.style.height = notesHeight + 'px';
  displayWrapper.style.height = wh - (60) - db;
  dbwrapper.style.width = displayWidth + 'px';
  dbwrapper.style.height = db + 'px';
}

window.onresize = resizeContent;

var resizeHandle = document.createElement('canvas');
((handle, ctx) => {
  handle.style.position = 'absolute';
  handle.style.cursor = 'se-resize';
  handle.style.right = '0px';
  handle.style.bottom = '0px';
  var w = handle.width = 10;
  var h = handle.height = 10;
  ctx.fillStyle = '#666666';

  function draw() {
    ctx.fillRect(w-3,h-5,1,1);
    ctx.fillRect(w-4,h-4,1,1);
    ctx.fillRect(w-5,h-3,1,1);
    ctx.fillRect(w-3,h-9,1,1);
    ctx.fillRect(w-3,h-9,1,1);
    ctx.fillRect(w-4,h-8,1,1);
    ctx.fillRect(w-5,h-7,1,1);
    ctx.fillRect(w-6,h-6,1,1);
    ctx.fillRect(w-7,h-5,1,1);
    ctx.fillRect(w-8,h-4,1,1);
    ctx.fillRect(w-9,h-3,1,1);
  }

  function clear() {
    ctx.clearRect(0,0,w,h);
  }

  function onmove(event) {
    var wsize = min(window.innerWidth, window.innerHeight);
    BOARD_SIZE = max(handle.offsetLeft + event.offsetX, handle.offsetTop + event.offsetY, 244);
    BOARD_SIZE = round(min(BOARD_SIZE, wsize * 0.8));
    CELL_SIZE = BOARD_SIZE / 8;
    canvas.width = canvas.height = BOARD_SIZE;
    resizeContent();
  }

  handle.onpointerdown = function(event) {
    this.setPointerCapture(event.pointerId);
    handle.onpointermove = onmove;
  }

  handle.onpointerup = function(event) {
    this.releasePointerCapture(event.pointerId);
    handle.onpointermove = null;
  }

  handle.onpointerover = function(event) {
    handle.onpointermove = null;
    draw();
  }

  handle.onpointerout = function(event) {
    clear();
  }

  handle.onpointer

  wrapper.appendChild(handle);
})(resizeHandle, resizeHandle.getContext('2d'));

document.body.appendChild(wrapper);

var state = GameState();
var config = Settings.config;
var input = Input(canvas);
var ui = UIState(state,input);
Settings.load();

var playerColor = 1;

var SELF = 0;
var PLAYER = 1;
var STOCKFISH = 2;
var TRAINING = 3;

var opponent = SELF;

var BOARD_SIZE = (window.innerWidth - 24) / 2;
var CELL_SIZE = BOARD_SIZE / 8;

canvas.width = canvas.height = BOARD_SIZE;

resizeContent();

renderMoves(state);


updateDB();

function loop() {
  requestAnimationFrame(loop);
  Renderer.draw(ctx,state,ui,config);
}

Init();
loop();