// Color := -1 | +1
// Color.BLACK = -1;
// Color.WHITE = +1;



// PieceType := [1..6]
// PieceType.NULL   = 0;
// PieceType.PAWN   = 1;
// PieceType.KNIGHT = 2;
// PieceType.BISHOP = 3;
// PieceType.ROOK   = 4;
// PieceType.QUEEN  = 5;
// PieceType.KING   = 6;



// Piece := [-6..6]
// Piece.color = piece => Math.sign(piece);
// Piece.type = piece => Math.abs(piece);
// Piece.NULL = 0;



// Square := [0..63]
// Square.file = square => square & 7;
// Square.rank = square => square >> 3;
// Square.NULL = -1;



// Board := Int8Array(64)[Piece]



// Move = (
//   from,          // 6 bit uint 6
//   to,            // 6 bit uint 12
//   capture = -1,  // 7 bit int  19
//   castle = -1,   // 7 bit int  26
//   promotion = 0, // 3 bit uint 29
// ) =>
//     (promotion << 26)
//   | ((castle & 0b1111111) << 19)
//   | ((capture & 0b1111111) << 12)
//   | (to << 6)
//   | from;

// Move also may be bit 30 set if (capture !== -1) && (to !== capture),
// indicating an enpassant capture. this isnt necessary for move application
// and is only set during legality checking and only tested for afterward.

// Move.getFrom    = move => move & 63;
// Move.getTo      = move => move >> 6 & 63;
// Move.getCapture = move => move << 13 >> 25;
// Move.getCastle  = move => move << 6 >> 25;
// Move.getProm    = move => move >> 26;



// Undo = (
//   captured,  // 4 bit int   4
//   castling,  // 4 bits      8
//   enpassant, // 7 bit int   15
//   halfmove,  // 16 bit uint 31
// ) =>
//     (halfmove << 15)
//   | ((enpassant & 0b1111111) << 8)
//   | (castling << 4)
//   | (captured & 0b1111);

// Undo.getCaptured = undo => undo << 28 >> 28;
// Undo.getCastling = undo => undo >> 4 & 15;
// Undo.getEnpassant = undo => undo << 17 >> 25;
// Undo.getHalfmove = undo => undo >> 15;

// new:

// Undo = (
//   piece,     // 4 bit int   4
//   captured,  // 4 bit int   8
//   castling,  // 4 bits      12
//   enpassant, // 7 bit int   19
//   halfmove,  // 12 bit uint 31
// ) =>
//     (halfmove << 19)
//   | ((enpassant & 0b1111111) << 12)
//   | (castling << 8)
//   | ((captured & 0b1111) << 4)
//   | (piece & 0b1111);

// Undo.getPiece = undo => undo << 28 >> 28;
// Undo.getCaptured = undo => undo << 24 >> 28;
// Undo.getCastling = undo => undo >> 8 & 15;
// Undo.getEnpassant = undo => undo << 13 >> 25;
// Undo.getHalfmove = undo => undo >> 19;

var Square = (() => {

  var Square = {};

  var squares = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];

  Square.toString = function(square) {
    return squares[square];
  }

  Square.fromString = function(string) {
    return squares.indexOf(string.toLowerCase());
  }

  return Square;

})();

var Position = (() => {

  var sign = Math.sign;
  var abs = Math.abs;
  var isSafeInteger = Number.isSafeInteger;

  function Position(
    board = new Int8Array(64),
    turn = 1,
    castling = 0,
    enpassant = -1,
    halfmove = 0,
    fullmove = 1,
  ) {
    var position = {board,turn,castling,enpassant,halfmove,fullmove};
    Position.locateKings(position);
    position.epFile = -1; // todo: real check
    if (DEBUG) addMethods(position);
    return position;
  }

  function addMethods(position) {
    position.locateKings = () => Position.locateKings(position);
    position.copy = () => Position.copy(position);
    position.copyFrom = (from) => Position.copyTo(from, position);
    position.initial = () => Position.initial();
    position.makeMove = (move) => Position.makeMove(position, move);
    position.unmakeMove = (move) => Position.unmakeMove(position, move);
    position.fromFEN = (fen) => Position.fromFEN(fen, position);
    position.toFEN = () => Position.toFEN(position);
    position.toAscii = () => Position.toAscii(position);
  }

  Position.locateKings = function(position) {
    var board = position.board;
    var i = 0;
    position.wk = -1;
    position.bk = -1;
    for (; i < 64; i++) {
      if (board[i] === 6) {
        position.wk = i;
      } else if (board[i] === -6) {
        position.bk = i;
      }
    }
  }

  Position.copy = function(from) {
    var position = {
      board: from.board.slice(),
      turn: from.turn,
      castling: from.castling,
      enpassant: from.enpassant,
      halfmove: from.halfmove,
      fullmove: from.fullmove,
      epFile: from.epFile,
      wk: from.wk,
      bk: from.bk,
    };
    if (DEBUG) addMethods(position);
  }

  Position.copyTo = function(src, dest) {
    dest.board.set(src.board);
    dest.turn = src.turn;
    dest.castling = src.castling;
    dest.enpassant = src.enpassant;
    dest.halfmove = src.halfmove;
    dest.fullmove = src.fullmove;
    dest.epFile = src.epFile;
    dest.wk = src.wk;
    dest.bk = src.bk;
  }

  var initialPosition = new Int8Array([
    +4, +2, +3, +5, +6, +3, +2, +4,
    +1, +1, +1, +1, +1, +1, +1, +1,
     0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,  0,  0,
    -1, -1, -1, -1, -1, -1, -1, -1,
    -4, -2, -3, -5, -6, -3, -2, -4
  ]);

  Position.initial = function() {
    var position = {
      board: new Int8Array(initialPosition),
      turn: 1,
      castling: 15,
      enpassant: -1,
      halfmove: 0,
      fullmove: 1,
      wk: 4,
      bk: 60,
    };
    if (DEBUG) addMethods(position);
    return position;
  }

  var UndoStack = (() => {

    var stack = new Int32Array(2048);

    var UndoStack = {};

    var index = 0;

    UndoStack.push = function(undo) {
      stack[index] = undo;
      index = (index + 1)  & 2047;
    }

    UndoStack.pop = function() {
      index = (index - 1) & 2047;
      return stack[index];
    }

    return UndoStack;

  })();

  var pushUndo = UndoStack.push;
  var popUndo = UndoStack.pop;

  if (DEBUG) Position.UndoStack = UndoStack;

  var castleMask = new Uint8Array([11, 15, 15, 15, 3, 15, 15, 7, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 14, 15, 15, 15, 12, 15, 15, 13]);

  Position.makeMove = function(position, move) {
    var board = position.board;
    var turn = position.turn;
    var halfmove = position.halfmove;

    var from = move & 63; // Move.getFrom(move);
    var to = move >> 6 & 63; // Move.getTo(move);
    var capture = move << 13 >> 25; // Move.getCapture(move);
    var castle = move << 6 >> 25; // Move.getCastle(move);
    var promotion = move >> 26; // Move.getProm(move);

    var piece = board[from];
    var type = abs(piece);

    if (type === 6) {
      if (turn === 1) position.wk = to;
      else position.bk = to;
    }

    var isPawnMove = type === 1;
    var isCapture = capture > -1;
    var updateEnpassant = isPawnMove && to - from === 16 * turn;
    var resetHalfmoves = isCapture || isPawnMove;
    var captured = isCapture ? board[capture] : 0;

    pushUndo(halfmove << 19
          | (position.enpassant & 0b1111111) << 12
          | position.castling << 8
          | (captured & 0b1111) << 4
          | (piece & 0b1111));

    position.castling &= castleMask[from] & castleMask[to];

    if (castle > -1) {
      board[sign(from - castle) + to] = board[castle];
      board[castle] = 0;
    }

    if (isCapture) board[capture] = 0;
    board[to] = promotion ? promotion * sign(piece) : piece;
    board[from] = 0;

    position.enpassant = updateEnpassant ? (from + to) >> 1 : -1;
    position.halfmove = resetHalfmoves ? 0 : halfmove + 1;
    position.fullmove += turn === -1;
    position.turn = -turn;
  }

  Position.unmakeMove = function(position, move) {
    var board = position.board;

    position.turn *= -1;
    var turn = position.turn;
    position.fullmove -= turn === -1;

    var undo = popUndo();
    position.castling = undo >> 8 & 15; // Undo.getCastling(undo);
    position.enpassant = undo << 13 >> 25; // Undo.getEnpassant(undo);
    position.halfmove = undo >> 19; // Undo.getHalfmove(undo);

    var from = move & 63;
    var to = move >> 6 & 63;
    var capture = move << 13 >> 25;
    var castle = move << 6 >> 25;

    if (castle !== -1) {
      var target = sign(from - castle) + to;
      board[castle] = board[target];
      board[target] = 0;
    }

    var piece = board[to];
    var type = abs(piece);
    board[to] = 0;
    board[from] = undo << 28 >> 28; // Undo.getPiece(undo);

    if (type === 6) {
      if (turn === 1) position.wk = from;
      else position.bk = from;
    }

    if (capture !== -1) {
      board[capture] = undo << 24 >> 28; // undo.getCaptured(undo);
    }
  }

  function validateFEN(fen) {
    var fields = fen.split(' ');
    if (fields.length !== 6) throw Error(`Invalid FEN: must have 6 fields, got ${fields.length}`);
    var ranks = fields[0].split('/');
    if (ranks.length !== 8) throw Error(`Invalid FEN: field 1 must have 8 ranks, got ${ranks.length}`);
    var rank, i = 0, j, l, c, k;
    for (; i < 8; i++) {
      rank = ranks[i];
      j = 0;
      l = rank.length;
      k = 0;
      for (; j < l; j++) {
        c = rank[j];
        switch (c) {
          case 'p': case 'n': case 'b':
          case 'r': case 'q': case 'k':
          case 'P': case 'N': case 'B':
          case 'R': case 'Q': case 'K':
          case '1': k++; break;
          case '2': k += 2; break;
          case '3': k += 3; break;
          case '4': k += 4; break;
          case '5': k += 5; break;
          case '6': k += 6; break;
          case '7': k += 7; break;
          case '8': k += 8; break;
          default: throw Error(`Invalid FEN: invalid character "${c}" in field 1`);
        }
      }
      if (k !== 8) throw Error(`Invalid FEN: ranks must add up to 8 pieces/spaces, found ${k} in ${rank}`);
    }

    if (!(fields[1] === 'w' || fields[1] === 'b'))
      throw Error(`Invalid FEN: field 2 must be "w" or "b", got ${fields[1]}`);

    var castlingFields = [
      'KQkq', 'KQk', 'KQq', 'KQ',
      'Kkq', 'Kk', 'Kq', 'K',
      'Qkq', 'Qk', 'Qq', 'Q',
      'kq', 'k', 'q', '-',
    ];
    if (!castlingFields.includes(fields[2]))
      throw Error(`Invalid FEN: field 3 must be either "-" or contain one or more unique characters from "KQkq" in order, got ${fields[2]}`);

    var epSquares = [
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
      '-',
    ];

    if (!epSquares.includes(fields[3]))
      throw Error(`Invalid FEN: field 4 must be either "-" or a valid en passant square, got ${fields[3]}`);

    var hm = +fields[4];
    var fm = +fields[5];

    if (!Number.isSafeInteger(hm) || hm < 0)
      throw Error(`Invalid FEN: field 5 must be a non-negative integer, got ${fields[4]}`);

    if (!Number.isSafeInteger(fm) || fm < 1)
      throw Error(`Invalid FEN: field 6 must be a positive integer, got ${fields[5]}`);
  }

  Position.fromFEN = function(fen, position = Position()) {
    var board = position.board;
    fen = fen.trim().replaceAll(/\s+/g,' ');
    var fields = fen.split(' ');
    if (fields.length === 4) {
      fields.push('0','1')
    }

    validateFEN(fields.join(' '));

    board.fill(0);
    var ranks = fields[0].split('/');
    if (ranks.length !== 8) throw Error('improper fen');
    var rank;
    var i = ranks.length - 1;
    var j;
    var k = 0;
    var ch;
    var index = 0;
    for (; i >= 0; i--) {
      rank = ranks[i];
      j = 0;
      for (; j < rank.length; j++) {
        ch = rank[j];
        if ('pnbrqkPNBRQK'.includes(ch)) k++;
        else if ('12345678'.includes(ch)) k += +ch;
        switch (ch) {
          case 'p': board[index++] = -1; continue;
          case 'n': board[index++] = -2; continue;
          case 'b': board[index++] = -3; continue;
          case 'r': board[index++] = -4; continue;
          case 'q': board[index++] = -5; continue;
          case 'k': board[index++] = -6; continue;
          case 'P': board[index++] = +1; continue;
          case 'N': board[index++] = +2; continue;
          case 'B': board[index++] = +3; continue;
          case 'R': board[index++] = +4; continue;
          case 'Q': board[index++] = +5; continue;
          case 'K': board[index++] = +6; continue;
          case '1': index += 1; continue;
          case '2': index += 2; continue;
          case '3': index += 3; continue;
          case '4': index += 4; continue;
          case '5': index += 5; continue;
          case '6': index += 6; continue;
          case '7': index += 7; continue;
          case '8': index += 8; continue;
        }
      }
      if (k !== 8) throw Error('improper fen');
      k = 0;
    }

    switch (fields[1]) {
      case 'w':
      case 'W': position.turn = +1; break;
      case 'b':
      case 'B': position.turn = -1; break;
    }

    var castleField = fields[2];
    var castling = 0;
    if (castleField.includes('K')) castling |= 8;
    if (castleField.includes('Q')) castling |= 4;
    if (castleField.includes('k')) castling |= 2;
    if (castleField.includes('q')) castling |= 1;
    position.castling = castling;

    var epField = fields[3];
    if (epField === '-') {
      position.enpassant = -1;
    } else {
      var file = epField[0].toLowerCase();
      var rank = epField[1];
      file = 'abcdefgh'.indexOf(file);
      rank = '12345678'.indexOf(rank);
      position.enpassant = rank << 3 | file;
    }

    var halfmove = +fields[4];
    position.halfmove = halfmove;

    var fullmove = +fields[5];
    position.fullmove = fullmove;

    Position.locateKings(position);
    position.epFile = -1; // todo: real check
    if (DEBUG) addMethods(position);
    return position;
  }

  Position.toFEN = function(position) {
    var board = position.board;
    var turn = position.turn;
    var enpassant = position.enpassant;
    var castling = position.castling;
    var halfmove = position.halfmove;
    var fullmove = position.fullmove;

    var fen = '';

    var i = 0;
    var rank = '';
    var empty = 0;
    for (; i < 64; i++) {
      var piece = board[i];
      if (piece === 0) empty++;
      else {
        if (empty > 0) {
          rank += empty.toString();
          empty = 0;
        }
        switch (piece) {
          case +1: rank += 'P'; break;
          case +2: rank += 'N'; break;
          case +3: rank += 'B'; break;
          case +4: rank += 'R'; break;
          case +5: rank += 'Q'; break;
          case +6: rank += 'K'; break;
          case -1: rank += 'p'; break;
          case -2: rank += 'n'; break;
          case -3: rank += 'b'; break;
          case -4: rank += 'r'; break;
          case -5: rank += 'q'; break;
          case -6: rank += 'k'; break;
        }
      }
      if (i % 8 === 7) {
        if (empty > 0) {
          rank += empty.toString();
          empty = 0;
        }
        fen = fen.length ? rank + '/' + fen : rank;
        rank = '';
      }
    }

    fen += ' ';

    switch (turn) {
      case +1: fen += 'w'; break;
      case -1: fen += 'b'; break;
    }

    fen += ' ';

    if (!castling) fen += '-';
    else {
      if (castling & 8) fen += 'K';
      if (castling & 4) fen += 'Q';
      if (castling & 2) fen += 'k';
      if (castling & 1) fen += 'q';
    }

    fen += ' ';

    if (enpassant === -1) {
      fen += '-';
    } else {
      var x = enpassant & 7;
      var y = enpassant >> 3 & 7;
      fen += 'abcdefgh'[x];
      fen += '12345678'[y];
    }

    fen += ' ';

    fen += halfmove.toString();

    fen += ' ';

    fen += fullmove.toString();

    return fen;
  }

  var toAscii = {
    [0]: '.',
    [+1]: 'P',
    [+2]: 'N',
    [+3]: 'B',
    [+4]: 'R',
    [+5]: 'Q',
    [+6]: 'K',
    [-1]: 'p',
    [-2]: 'n',
    [-3]: 'b',
    [-4]: 'r',
    [-5]: 'q',
    [-6]: 'k',
  };

  Position.toAscii = function(position) {
    var board = position.board;
    var txt = '';
    var y = 7;
    var x;
    var piece;
    for (; y >= 0; y--) {
      for (x = 0; x < 8; x++) {
        piece = board[y*8+x];
        txt += toAscii[piece];
        if (x < 7) txt += ' ';
      }
      if (y > 0) txt += '\n';
    }
    return txt;
  }

  return Position;

})();

var Moves = (() => {

  var sign = Math.sign;
  var abs = Math.abs;

  var PAWN_TO = LUT.PAWN_TO;
  var PAWN_MOVE = LUT.PAWN_MOVE;
  var PAWN_DBL_TO = LUT.PAWN_DBL_TO;
  var PAWN_DBL_MOVE = LUT.PAWN_DBL_MOVE;
  var PAWN_CAP_N = LUT.PAWN_CAP_N;
  var PAWN_CAP_TO = LUT.PAWN_CAP_TO;
  var PAWN_CAPS = LUT.PAWN_CAPS;
  var PAWN_EP_TO = LUT.PAWN_EP_TO;
  var PAWN_EP = LUT.PAWN_EP;
  var KNIGHT_TO = LUT.KNIGHT_TO;
  var KNIGHT_MOVES = LUT.KNIGHT_MOVES;
  var KNIGHT_CAPS = LUT.KNIGHT_CAPS;
  var KNIGHT_N = LUT.KNIGHT_N;
  var KING_TO = LUT.KING_TO;
  var KING_MOVES = LUT.KING_MOVES;
  var KING_CAPS = LUT.KING_CAPS;
  var KING_N = LUT.KING_N;
  var BISHOP_RAY = LUT.BISHOP_RAY;
  var BISHOP_MOVES = LUT.BISHOP_MOVES;
  var BISHOP_CAPS = LUT.BISHOP_CAPS;
  var BISHOP_OFF = LUT.BISHOP_OFF;
  var BISHOP_N = LUT.BISHOP_N;
  var ROOK_RAY = LUT.ROOK_RAY;
  var ROOK_MOVES = LUT.ROOK_MOVES;
  var ROOK_CAPS = LUT.ROOK_CAPS;
  var ROOK_OFF = LUT.ROOK_OFF;
  var ROOK_N = LUT.ROOK_N;

  function Moves(position, moves, index=0) {
    var board = position.board;
    var turn = position.turn;
    var castling = position.castling;
    var ep = position.enpassant;
    var epAvailable = false;
    var from = 0;
    var x, y;
    var piece;
    for (; from < 64; from++) {
      piece = board[from];
      if ((piece ^ turn) < 0) continue;
      switch (abs(piece)) {
//        case 1:   getPawnMoves(position, board, turn, from, from & 7, from >> 3);   break;
        case 1:
//        function getPawnMoves(position, board, turn, from, x, y) {
          var x = from & 7;
          var y = from >> 3;
          var isWhite = turn === +1;
          var isBlack = turn === -1;
          var isRank2 = y === 1;
          var isRank7 = y === 6;
          var isHome = isRank2 && isWhite
                    || isRank7 && isBlack;
          var isProm = isRank2 && isBlack
                    || isRank7 && isWhite;
          var piece;
          var target;
          var tx = x;
          var ty = y + turn;
          var base;
          if ((ty & -8) === 0) {
            target = ty << 3 | tx;
            if (board[target] === 0) {
              if (isProm) {
                base = from | target << 6 | 201322496;
                moves[index++] = base;
                moves[index++] = base + 67108864;
                moves[index++] = base + 134217728;
                moves[index++] = base + 201326592;
              } else {
                moves[index++] = from | target << 6 | 67104768;
              }
              if (isHome) {
                ty += turn;
                if ((ty & -8) === 0) {
                  target = ty << 3 | tx;
                  if (board[target] === 0) {
                    moves[index++] = from | target << 6 | 67104768;
                  }
                }
              }
            }
          }
          tx = x - 1;
          ty = y + turn;
          if (((tx | ty) & -8) === 0) {
            target = ty << 3 | tx;
            piece = board[target];
            if (piece !== 0 && (piece ^ turn) < 0) {
              if (isProm) {
                base = from | target << 6 | target << 12 | 200802304;
                moves[index++] = base;
                moves[index++] = base + 67108864;
                moves[index++] = base + 134217728;
                moves[index++] = base + 201326592;
              } else {
                moves[index++] = from | target << 6 | target << 12 | 66584576;
              }
            }
            if (ep === target) {
//            moves[index++] = from | target << 6 | (y << 3 | tx) << 12 | 1140326400;
              moves[index++] = from | target << 6 | (y << 3 | tx) << 12 | 66584576;
            }
          }
          tx = x + 1;
          ty = y + turn;
          if (((tx | ty) & -8) === 0) {
            target = ty << 3 | tx;
            piece = board[target];
            if (piece !== 0 && (piece ^ turn) < 0) {
              if (isProm) {
                base = from | target << 6 | target << 12 | 200802304;
                moves[index++] = base;
                moves[index++] = base + 67108864;
                moves[index++] = base + 134217728;
                moves[index++] = base + 201326592;
              } else {
                moves[index++] = from | target << 6 | target << 12 | 66584576;
              }
            }
            if (ep === target) {
//            moves[index++] = from | target << 6 | (y << 3 | tx) << 12 | 1140326400;
              moves[index++] = from | target << 6 | (y << 3 | tx) << 12 | 66584576;
            }
          }
          break;
/*      case 1:
          var prom = turn === 1 ? from >> 3 === 6 : from >> 3 === 1;
          if (prom) {
            var i = from | (1 - turn) << 5;
            var i2 = i << 1;
            var base;
            if (board[PAWN_TO[i]] === 0) {
              base = PAWN_MOVE[i];
              moves[index++] = base | 134217728;
              moves[index++] = base | 201326592;
              moves[index++] = base | 268435456;
              moves[index++] = base | 335544320;
            }
            var capn = PAWN_CAP_N[i];
            var piece, target;
            if (capn) {
              target = PAWN_CAP_TO[i2];
              piece = board[target];
              if (piece && (piece ^ turn) < 0) {
                base = PAWN_CAPS[i2];
                moves[index++] = base | 134217728;
                moves[index++] = base | 201326592;
                moves[index++] = base | 268435456;
                moves[index++] = base | 335544320;
              }
            }
            if (capn & 2) {
              target = PAWN_CAP_TO[i2 + 1];
              piece = board[target];
              if (piece && (piece ^ turn) < 0) {
                base = PAWN_CAPS[i2 + 1];
                moves[index++] = base | 134217728;
                moves[index++] = base | 201326592;
                moves[index++] = base | 268435456;
                moves[index++] = base | 335544320;
              }
            }
          } else {
            var i = from | (1 - turn) << 5;
            var i2 = i << 1;
            if (board[PAWN_TO[i]] === 0) {
              moves[index++] = PAWN_MOVE[i];
              var dbl = PAWN_DBL_MOVE[i];
              if (dbl && board[PAWN_DBL_TO[i]] === 0) {
                moves[index++] = dbl;
              }
            }
            var capn = PAWN_CAP_N[i];
            var piece, target;
            if (capn) {
              target = PAWN_CAP_TO[i2];
              piece = board[target];
              if (piece && (piece ^ turn) < 0) {
                moves[index++] = PAWN_CAPS[i2];
              }
              if (target === ep) {
                piece = board[PAWN_EP_TO[i2]];
                if (piece && (piece ^ turn) < 0) {
                  moves[index++] = PAWN_EP[i2];
                }
              }
            }
            if (capn & 2) {
              target = PAWN_CAP_TO[i2 + 1];
              piece = board[target];
              if (piece && (piece ^ turn) < 0) {
                moves[index++] = PAWN_CAPS[i2 + 1];
              }
              if (target === ep) {
                piece = board[PAWN_EP_TO[i2 + 1]];
                if (piece && (piece ^ turn) < 0) {
                  moves[index++] = PAWN_EP[i2 + 1];
                }
              }
            }
          }
          break;
*/
        case 2:
          var i = from << 3;
          var n = i + KNIGHT_N[from];
          var piece;
          for (; i < n; i++) {
            piece = board[KNIGHT_TO[i]];
            if (piece === 0) {
              moves[index++] = KNIGHT_MOVES[i];
            } else if ((piece ^ turn) < 0) {
              moves[index++] = KNIGHT_CAPS[i];
            }
          }
          break;
        case 3:
          var d = from << 2;
          var dl = d + 4;
          var i, il, piece;
          for (; d < dl; d++) {
            i = BISHOP_OFF[d];
            il = i + BISHOP_N[d];
            for (; i < il; i++) {
              piece = board[BISHOP_RAY[i]];
              if (piece === 0) {
                moves[index++] = BISHOP_MOVES[i];
              } else {
                if ((piece ^ turn) < 0) {
                  moves[index++] = BISHOP_CAPS[i];
                }
                break;
              }
            }
          }
          break;
        case 4:
          var d = from << 2;
          var dl = d + 4;
          var i, il, piece;
          for (; d < dl; d++) {
            i = ROOK_OFF[d];
            il = i + ROOK_N[d];
            for (; i < il; i++) {
              piece = board[ROOK_RAY[i]];
              if (piece === 0) {
                moves[index++] = ROOK_MOVES[i];
              } else {
                if ((piece ^ turn) < 0) {
                  moves[index++] = ROOK_CAPS[i];
                }
                break;
              }
            }
          }
          break;
        case 5:
          var d = from << 2;
          var dl = d + 4;
          var ri, bi, ril, bil, piece;
          for (; d < dl; d++) {
            ri = ROOK_OFF[d];
            bi = BISHOP_OFF[d];
            ril = ri + ROOK_N[d];
            bil = bi + BISHOP_N[d];
            for (; ri < ril; ri++) {
              piece = board[ROOK_RAY[ri]];
              if (piece === 0) {
                moves[index++] = ROOK_MOVES[ri];
              } else {
                if ((piece ^ turn) < 0) {
                  moves[index++] = ROOK_CAPS[ri];
                }
                break;
              }
            }
            for (; bi < bil; bi++) {
              piece = board[BISHOP_RAY[bi]];
              if (piece === 0) {
                moves[index++] = BISHOP_MOVES[bi];
              } else {
                if ((piece ^ turn) < 0) {
                  moves[index++] = BISHOP_CAPS[bi];
                }
                break;
              }
            }
          }
          break;
        case 6:
          var i = from << 3;
          var n = i + KING_N[from];
          var piece;
          for (; i < n; i++) {
            piece = board[KING_TO[i]];
            if (piece === 0) {
              moves[index++] = KING_MOVES[i];
            } else if ((piece ^ turn) < 0) {
              moves[index++] = KING_CAPS[i];
            }
          }
          if (turn === 1) {
            if (from !== 4) continue;
            if (castling & 8 &&
                board[5] === 0 &&
                board[6] === 0) {
              moves[index++] = 4190596;
            }
            if (castling & 4 &&
                board[3] === 0 &&
                board[2] === 0 &&
                board[1] === 0) {
              moves[index++] = 520324;
            }
          } else {
            if (from !== 60) continue;
            if (castling & 2 &&
                board[61] === 0 &&
                board[62] === 0) {
              moves[index++] = 33554364;
            }
            if (castling & 1 &&
                board[59] === 0 &&
                board[58] === 0 &&
                board[57] === 0) {
              moves[index++] = 29884092;
            }
          }
          break;
      }
    }
    return index;
  }

  Moves.toString = function(_moves = moves, _count = count) {
    return Array.from(_moves.slice(0,_count)).map(function(move) {
    var from = move & 63;
    var to = move >> 6 & 63;
    var castle = move << 6 >> 25;
    var prom = move >> 26;
    if (castle !== -1) {
      if (castle < from) return 'O-O-O';
      else return 'O-O';
    }
    var str = '';
    if (from === -1) return;
    if (to === -1) return;
    if (from < 0 || from > 63) return;
    if (to < 0 || to > 63) return;
    str = 'abcdefgh'[from & 7] + '12345678'[from >> 3]
        + 'abcdefgh'[to & 7] + '12345678'[to >> 3];
    if (prom !== 0) {
      return str + '=' + 'NBRQ'[prom-2];
    } else return str;
  })
  }

  return Moves;

})();

var Premoves = (() => {

  var sign = Math.sign;
  var abs = Math.abs;

  var PAWN_TO = LUT.PAWN_TO;
  var PAWN_DBL_TO = LUT.PAWN_DBL_TO;
  var PAWN_CAP_TO = LUT.PAWN_CAP_TO;
  var KNIGHT_TO = LUT.KNIGHT_TO;
  var KNIGHT_MOVES = LUT.KNIGHT_MOVES;
  var KNIGHT_CAPS = LUT.KNIGHT_CAPS;
  var KNIGHT_N = LUT.KNIGHT_N;
  var KING_TO = LUT.KING_TO;
  var KING_MOVES = LUT.KING_MOVES;
  var KING_CAPS = LUT.KING_CAPS;
  var KING_N = LUT.KING_N;
  var BISHOP_RAY = LUT.BISHOP_RAY;
  var BISHOP_MOVES = LUT.BISHOP_MOVES;
  var BISHOP_CAPS = LUT.BISHOP_CAPS;
  var BISHOP_OFF = LUT.BISHOP_OFF;
  var BISHOP_N = LUT.BISHOP_N;
  var ROOK_RAY = LUT.ROOK_RAY;
  var ROOK_MOVES = LUT.ROOK_MOVES;
  var ROOK_CAPS = LUT.ROOK_CAPS;
  var ROOK_OFF = LUT.ROOK_OFF;
  var ROOK_N = LUT.ROOK_N;

  function Premoves(position, from) {
    var board = position.board;
    var turn = position.turn;
    var castling = position.castling;
    from &= 63;
    var x = from & 7;
    var y = from >> 3;
    var piece = board[from];
    var type = abs(piece);
    var color = sign(piece);
    var moves = [];
    switch (type) {
      case 1:
        function pushMove(to) {
          if (to >= 64) return;
          var capture = board[to] ? to << 12 : 520192;
          var move = from | to << 6 | capture | 66584576;
          if (to < 8 || to >= 56) {
            moves.push(
              move | 134217728,
              move | 201326592,
              move | 268435456,
              move | 335544320,
            );
          } else {
            moves.push(move);
          }
        }
        var i = (color < 0) << 6 | from;
        pushMove(PAWN_TO[i]);
        pushMove(PAWN_DBL_TO[i]);
        pushMove(PAWN_CAP_TO[i << 1]);
        pushMove(PAWN_CAP_TO[i << 1 | 1]);
        break;
        case 2:
          var i = from << 3;
          var n = i + KNIGHT_N[from];
          var piece;
          for (; i < n; i++) {
            piece = board[KNIGHT_TO[i]];
            if (piece) moves.push(KNIGHT_CAPS[i]);
            else moves.push(KNIGHT_MOVES[i]);
          }
          break;
        case 3:
          var d = from << 2;
          var dl = d + 4;
          var i, il, piece;
          for (; d < dl; d++) {
            i = BISHOP_OFF[d];
            il = i + BISHOP_N[d];
            for (; i < il; i++) {
              piece = board[BISHOP_RAY[i]];
              if (piece) moves.push(BISHOP_CAPS[i]);
              else moves.push(BISHOP_MOVES[i]);
            }
          }
          break;
        case 4:
          var d = from << 2;
          var dl = d + 4;
          var i, il, piece;
          for (; d < dl; d++) {
            i = ROOK_OFF[d];
            il = i + ROOK_N[d];
            for (; i < il; i++) {
              piece = board[ROOK_RAY[i]];
              if (piece) moves.push(ROOK_CAPS[i]);
              else moves.push(ROOK_MOVES[i]);
            }
          }
          break;
        case 5:
          var d = from << 2;
          var dl = d + 4;
          var ri, bi, ril, bil, piece;
          for (; d < dl; d++) {
            ri = ROOK_OFF[d];
            bi = BISHOP_OFF[d];
            ril = ri + ROOK_N[d];
            bil = bi + BISHOP_N[d];
            for (; ri < ril; ri++) {
              piece = board[ROOK_RAY[ri]];
              if (piece) moves.push(ROOK_CAPS[ri]);
              else moves.push(ROOK_MOVES[ri]);
            }
            for (; bi < bil; bi++) {
              piece = board[BISHOP_RAY[bi]];
              if (piece) moves.push(BISHOP_CAPS[bi]);
              else moves.push(BISHOP_MOVES[bi]);
            }
          }
          break;
        case 6:
          var i = from << 3;
          var n = i + KING_N[from];
          var piece;
          for (; i < n; i++) {
            piece = board[KING_TO[i]];
            if (piece) moves.push(KING_CAPS[i]);
            else moves.push(KING_MOVES[i]);
          }
          if (color === 1 && from === 4) {
            if (castling & 8 &&
                board[5] === 0 &&
                board[6] === 0) {
              moves.push(4190596);
            }
            if (castling & 4 &&
                board[3] === 0 &&
                board[2] === 0 &&
                board[1] === 0) {
              moves.push(520324);
            }
          } else if (color === -1 && from === 60) {
            if (castling & 2 &&
                board[61] === 0 &&
                board[62] === 0) {
              moves.push(33554364);
            }
            if (castling & 1 &&
                board[59] === 0 &&
                board[58] === 0 &&
                board[57] === 0) {
              moves.push(29884092);
            }
          }
          break;
      }
    return moves;
  }

  return Premoves;

})();

var LegalMoves = (() => {

  var KNIGHT_TO = LUT.KNIGHT_TO;
  var KNIGHT_MOVES = LUT.KNIGHT_MOVES;
  var KNIGHT_CAPS = LUT.KNIGHT_CAPS;
  var KNIGHT_N = LUT.KNIGHT_N;
  var KING_TO = LUT.KING_TO;
  var KING_MOVES = LUT.KING_MOVES;
  var KING_CAPS = LUT.KING_CAPS;
  var KING_N = LUT.KING_N;
  var BISHOP_RAY = LUT.BISHOP_RAY;
  var BISHOP_MOVES = LUT.BISHOP_MOVES;
  var BISHOP_CAPS = LUT.BISHOP_CAPS;
  var BISHOP_OFF = LUT.BISHOP_OFF;
  var BISHOP_N = LUT.BISHOP_N;
  var ROOK_RAY = LUT.ROOK_RAY;
  var ROOK_MOVES = LUT.ROOK_MOVES;
  var ROOK_CAPS = LUT.ROOK_CAPS;
  var ROOK_OFF = LUT.ROOK_OFF;
  var ROOK_N = LUT.ROOK_N;
  var abs = Math.abs;

  function LegalMoves(position, moves, index=0) {
    var board = position.board;
    var turn = position.turn;
    var end = Moves(position, moves, index);
    var king = position.turn * 6;
    var kingAt = turn === 1 ? position.wk : position.bk;
    if (kingAt === -1) {
      return end;
    }
    var read = index;
    var write = index;
    var move;
    for (; read < end; read++) {
      move = moves[read];
      if (checkMove(position, board, turn, move, kingAt)) moves[write++] = move;
    }
    return write;
  }

  function checkMove(position, board, turn, move, kingAt) {
    var from = move & 63;
    var to = move >> 6 & 63;
    var castle = move << 6 >> 25;
    var type = abs(board[from]);
    var inCheck;

    if (type === 6) {
      if (castle !== -1) {

      if (isInCheck(board, turn, kingAt)) return false;

        var middle = (from + to) >> 1;
        var midMove = middle << 6 | from | 67104768; // Move(from, middle);

        Position.makeMove(position, midMove);
        inCheck = isInCheck(board, turn, middle);
        Position.unmakeMove(position, midMove);
        if (inCheck) return false;
      }
      Position.makeMove(position, move);
      var inCheck = isInCheck(board, turn, to);
      Position.unmakeMove(position, move);
      return !inCheck;
    }

    Position.makeMove(position, move);
    var inCheck = isInCheck(board, turn, kingAt);
    Position.unmakeMove(position, move);
    return !inCheck;
  }

  function isInCheck(board, turn, kingAt) {
    var x = kingAt & 7;
    var y = kingAt >> 3;
    var op = turn * -1;
    var on = turn * -2;
    var ob = turn * -3;
    var or = turn * -4;
    var oq = turn * -5;
    var ok = turn * -6;

    if (checkKnight(board, kingAt, on)) return true;
    if (checkKing(board, kingAt, ok)) return true;
    if (checkBishop(board, kingAt, ob, oq)) return true;
    if (checkRook(board, kingAt, or, oq)) return true;
    if (checkOffsets(board,x,y,[[-1, turn],[+1, turn]],op)) return true;

    return false;
  }

  LegalMoves.isInCheck = isInCheck;

  function checkKnight(board, kingAt, knight) {
    var i = kingAt << 3;
    var l = i + KNIGHT_N[kingAt];
    for (; i < l; i++) {
      if (board[KNIGHT_TO[i]] === knight) return true;
    }
    return false;
  }

  function checkKing(board, kingAt, king) {
    var i = kingAt << 3;
    var l = i + KING_N[kingAt];
    for (; i < l; i++) {
      if (board[KING_TO[i]] === king) return true;
    }
    return false;
  }

  function checkBishop(board, kingAt, bishop, queen) {
    var d = kingAt << 2;
    var dl = d + 4;
    var i, il, piece;
    for (; d < dl; d++) {
      i = BISHOP_OFF[d];
      il = i + BISHOP_N[d];
      for (; i < il; i++) {
        piece = board[BISHOP_RAY[i]];
        if (piece === 0) continue;
        if (piece === bishop || piece === queen) return true;
        break;
      }
    }
    return false;
  }

  function checkRook(board, kingAt, rook, queen) {
    var d = kingAt << 2;
    var dl = d + 4;
    var i, il, piece;
    for (; d < dl; d++) {
      i = ROOK_OFF[d];
      il = i + ROOK_N[d];
      for (; i < il; i++) {
        piece = board[ROOK_RAY[i]];
        if (piece === 0) continue;
        if (piece === rook || piece === queen) return true;
        break;
      }
    }
    return false;
  }

  function checkOffsets(board, x, y, offsets, value) {
    var tx, ty, target;
    var i = 0;
    var len = offsets.length;
    for (; i < len; i++) {
      tx = x + offsets[i][0];
      ty = y + offsets[i][1];
      if (((tx | ty) & -8) !== 0) continue;
      if (board[ty << 3 | tx] === value) return true;
    }
    return false;
  }

  LegalMoves.toString = function(_moves = moves) {
    return Array.from(_moves.slice(0,count)).map(Move.toString);
  }

  return LegalMoves;

})();