var images = (() => {

  var images = {
    wp: new Image(),
    wn: new Image(),
    wb: new Image(),
    wr: new Image(),
    wq: new Image(),
    wk: new Image(),
    bp: new Image(),
    bn: new Image(),
    bb: new Image(),
    br: new Image(),
    bq: new Image(),
    bk: new Image(),
  };

  images.piece = {
    [+1]: images.wp,
    [+2]: images.wn,
    [+3]: images.wb,
    [+4]: images.wr,
    [+5]: images.wq,
    [+6]: images.wk,
    [-1]: images.bp,
    [-2]: images.bn,
    [-3]: images.bb,
    [-4]: images.br,
    [-5]: images.bq,
    [-6]: images.bk,
  };

  var pending = 0;

  var gen = 0;

  images.ready = false;

  images.onload = null;

  function load(img, src, _gen) {
    img.onload = img.onerror = function() {
      if (_gen !== gen) return;
      img.onload = img.onerror = null;
      pending--;
      if (pending === 0) {
        images.ready = true;
        if (images.onload) images.onload();
      }
    }
    img.src = src;
  }

  var boards = {
    // no longer using images for board
  };

  var pieces = {};

  function addPiece(name,dir,ext='svg') {
    pieces[name] = {
      wp: "./images/pieces/" + dir + "/wp." + ext,
      wn: "./images/pieces/" + dir + "/wn." + ext,
      wb: "./images/pieces/" + dir + "/wb." + ext,
      wr: "./images/pieces/" + dir + "/wr." + ext,
      wq: "./images/pieces/" + dir + "/wq." + ext,
      wk: "./images/pieces/" + dir + "/wk." + ext,
      bp: "./images/pieces/" + dir + "/bp." + ext,
      bn: "./images/pieces/" + dir + "/bn." + ext,
      bb: "./images/pieces/" + dir + "/bb." + ext,
      br: "./images/pieces/" + dir + "/br." + ext,
      bq: "./images/pieces/" + dir + "/bq." + ext,
      bk: "./images/pieces/" + dir + "/bk." + ext,
    };
  }

  addPiece("FreeSerif", "free_serif", "svg");
  addPiece("Arial Unicode MS", "arial_unicode_ms", "svg");
  addPiece("Symbola", "symbola", "svg");
  addPiece("Chess (font)", "chess_font", "svg");
  addPiece("DejaVu Sans", "menlo", "svg");
  addPiece("Gothic A1", "gothic_a1", "svg");
  addPiece("Pecita", "pecita", "svg");
  addPiece("Nishiki Teki", "nishiki_teki", "svg");

  var boardStyles = Object.getOwnPropertyNames(boards);
  var pieceStyles = Object.getOwnPropertyNames(pieces);

  images.boardStyles = boardStyles;
  images.pieceStyles = pieceStyles;

  images.boardStyle = 'Brown';
  images.pieceStyle = 'FreeSerif';

  images.setBoardStyle = function(style) {
    setStyles(style, images.pieceStyle);
  }

  images.setPieceStyle = function(style) {
    setStyles(images.boardStyle, style);
  }

  function setStyles(boardStyle, pieceStyle) {
    var board = boards[boardStyle];
//  if (!board) return;
    var _pieces = pieces[pieceStyle];
    if (!_pieces) return;
    images.boardStyle = boardStyle;
    images.pieceStyle = pieceStyle;
//  images.dark = board.darkSquares;
//  images.light = board.lightSquares;
//  images.highlight = board.highlight;
    images.ready = false;
    var _gen = ++gen;
    pending = 12;
//  load(images.board, board.path, _gen);
    load(images.wp, _pieces.wp, _gen);
    load(images.wn, _pieces.wn, _gen);
    load(images.wb, _pieces.wb, _gen);
    load(images.wr, _pieces.wr, _gen);
    load(images.wq, _pieces.wq, _gen);
    load(images.wk, _pieces.wk, _gen);
    load(images.bp, _pieces.bp, _gen);
    load(images.bn, _pieces.bn, _gen);
    load(images.bb, _pieces.bb, _gen);
    load(images.br, _pieces.br, _gen);
    load(images.bq, _pieces.bq, _gen);
    load(images.bk, _pieces.bk, _gen);
  }

  images.setStyles = setStyles;

  setStyles('', 'FreeSerif');

  return images;

})();

var audio = (() => {

  var audio = {};

  audio.mute = true;

  audio.play = () => {};

  return audio; // todo: add sounds i didnt rip from chess.com

  audio.play = function(key) {
    if (audio.mute) return;
    var au = audio[key];
    if (!au) return;
    au.currentTime = 0;
    au.play();
  }

  audio.setTheme = function(theme) {
    var _paths = paths[theme];
    if (!_paths) return;
    audio.theme = theme;
    var i = 0;
    var len = keys.length;
    var key, au;
    for (; i < len; i++) {
      key = keys[i];
      au = audio[key];
      au.pause();
      au.currentTime = 0;
      au.src = _paths[key];
      au.load();
    }
  }

  var fuckingdefault = {
    "move-self": "./audio/default/move-self.webm",
    "move-check": "./audio/default/move-check.webm",
    "capture": "./audio/default/capture.webm",
    "castle": "./audio/default/castle.webm",
    "promote": "./audio/default/promote.webm",
    "premove": "./audio/default/premove.webm",

    "game-start": "./audio/default/game-start.webm",
    "game-end": "./audio/default/game-end.webm",
  };

  var keys = Object.keys(fuckingdefault);

  keys.forEach(key => {
    audio[key] = new Audio();
  });

  var paths = { "Default": fuckingdefault };

  function addTheme(name, _paths) {
    var _keys = Object.keys(_paths);
    var obj = {};
    var i = 0;
    var len = keys.length;
    var key;
    for (; i < len; i++) {
      key = keys[i];
      if (_keys.includes(key)) obj[key] = _paths[key];
      else obj[key] = fuckingdefault[key];
    }
    paths[name] = obj;
  }

  var themes = Object.keys(paths);

  audio.themes = themes;

  audio.setTheme("Default");

  return audio;

})();