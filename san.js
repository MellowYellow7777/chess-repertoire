var SAN = (() => {

  var isInCheck = LegalMoves.isInCheck;

  var SAN = {};

  var regex = /(?:(O-O-O|O-O)|(?:([NBRQK])?([a-h][1-8]|[a-h]|[1-8])?(x)?([a-h][1-8])(?:(?:=)([NBRQ]))?))([+#])?/

  SAN.regex = regex;

  var moves = new Int32Array(512);

  var fileToString = 'abcdefgh';

  var rankToString = '12345678';

  var squareToString = [
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  ];

  var rankFromString = {
    '1': 0, '2': 1, '3': 2, '4': 3,
    '5': 4, '6': 5, '7': 6, '8': 7,
  };

  var fileFromString = {
    'a': 0, 'b': 1, 'c': 2, 'd': 3,
    'e': 4, 'f': 5, 'g': 6, 'h': 7,
  };

  var squareFromString = {
    'a1': 0, 'b1': 1, 'c1': 2, 'd1': 3, 'e1': 4, 'f1': 5, 'g1': 6, 'h1': 7,
    'a2': 8, 'b2': 9, 'c2': 10, 'd2': 11, 'e2': 12, 'f2': 13, 'g2': 14, 'h2': 15,
    'a3': 16, 'b3': 17, 'c3': 18, 'd3': 19, 'e3': 20, 'f3': 21, 'g3': 22, 'h3': 23,
    'a4': 24, 'b4': 25, 'c4': 26, 'd4': 27, 'e4': 28, 'f4': 29, 'g4': 30, 'h4': 31,
    'a5': 32, 'b5': 33, 'c5': 34, 'd5': 35, 'e5': 36, 'f5': 37, 'g5': 38, 'h5': 39,
    'a6': 40, 'b6': 41, 'c6': 42, 'd6': 43, 'e6': 44, 'f6': 45, 'g6': 46, 'h6': 47,
    'a7': 48, 'b7': 49, 'c7': 50, 'd7': 51, 'e7': 52, 'f7': 53, 'g7': 54, 'h7': 55,
    'a8': 56, 'b8': 57, 'c8': 58, 'd8': 59, 'e8': 60, 'f8': 61, 'g8': 62, 'h8': 63,
  }

  var typeFromAscii = {
    'P': 1, 'N': 2, 'B': 3, 'R': 4, 'Q': 5, 'K': 6,
    'p': 1, 'n': 2, 'b': 3, 'r': 4, 'q': 5, 'k': 6,
  };

  var pieceFromAscii = {
    'P': +1, 'N': +2, 'B': +3, 'R': +4, 'Q': +5, 'K': +6,
    'p': -1, 'n': -2, 'b': -3, 'r': -4, 'q': -5, 'k': -6,
  };

  var pieceToAscii = {
    [+1]: 'P', [+2]: 'N', [+3]: 'B', [+4]: 'R', [+5]: 'Q', [+6]: 'K',
    [-1]: 'p', [-2]: 'n', [-3]: 'b', [-4]: 'r', [-5]: 'q', [-6]: 'k',
  };

  SAN.fromMove = function(position, move) {
    var len = LegalMoves(position, moves);
    var board = position.board;
    Position.makeMove(position, move);
    var turn = position.turn;
    var kingAt = turn === 1 ? position.wk : position.bk;
    var check = isInCheck(board, turn, kingAt);
    var mate = false;
    if (check) {
      if (LegalMoves(position, moves, len) === 0) mate = true;
    }

    Position.unmakeMove(position, move);
    var from = move & 63; // Move.getFrom(move);
    var to = move >> 6 & 63; // Move.getTo(move);
    var capture = move << 13 >> 25; // Move.getCapture(move);
    var castle = move << 6 >> 25; // Move.getCastle(move);
    var promotion = move >> 26; // Move.getProm(move);
    var piece = board[from];
    var type = Math.abs(piece);
    var san = '';
    if (castle > -1) {
      if (castle === 0 || castle === 56) san = 'O-O-O';
      if (castle === 7 || castle === 63) san = 'O-O';
      if (mate) san += '#';
      else if (check) san += '+';
      return san;
    } else {
      switch (type) {
        case 2: san += 'N'; break;
        case 3: san += 'B'; break;
        case 4: san += 'R'; break;
        case 5: san += 'Q'; break;
        case 6: san += 'K'; break;
      }
      if (type === 1) {
        if (capture !== -1) { // capture !== Square.NULL
          san += fileToString[from & 7];
        }
      } else {
        var file = from & 7; // Square.file(from);
        var rank = from & 56; // Square.rank(from);
        var str = squareToString[from];
        var i = 0;
        var m, mpiece, mfrom, mto, mfile, mrank;
        var sameFile = false;
        var sameRank = false;
        var collision = false;
        for (; i < len; i++) {
          m = moves[i];
          if (m === move) continue;
          mfrom = m & 63; // Move.getFrom(m);
          mpiece = board[mfrom];
          if (mpiece !== piece) continue;
          mto = m >> 6 & 63; // Move.getTo(m);
          if (mto !== to) continue;
          collision = true;
          mfile = mfrom & 7; // Square.file(mfrom);
          mrank = mfrom & 56; // Square.rank(mfrom);
          if (mfile === file) sameFile = true;
          if (mrank === rank) sameRank = true;
          if (sameFile && sameRank) break;
        }
        if (collision) {
          if (!sameFile || sameRank) {
            san += str[0];
          }
          if (sameFile) {
            san += str[1];
          }
        }
      }
      if (capture !== -1) san += 'x';
      san += squareToString[to];
      switch (promotion) {
        case 2: san += '=N'; break;
        case 3: san += '=B'; break;
        case 4: san += '=R'; break;
        case 5: san += '=Q'; break;
      }
      if (mate) san += '#';
      else if (check) san += '+';
    }
    return san;
  }

  SAN.toMove = function(position, san, _moves = null, start, end) {
    // white kingside : 4190596
    // white queenside : 520324
    // black kingside: 33554364
    // black queenside: 29884092
    if (san === 'O-O') {
      if (position.turn === 1) return 4190596;
      else return 33554364;
    } else if (san === 'O-O-O') {
      if (position.turn === 1) return 520324;
      else return 29884092;
    }
    var m = san.match(regex);
    var castle = m[1];
    var type = m[2];
    var from = m[3];
    var capture = m[4];
    var to = m[5];
    var prom = m[6];
    var check = m[7];
    var moveArr;
    var len;
    if (_moves === null) {
      moveArr = moves;
      start = 0;
      end = LegalMoves(position, moves);
    } else {
      moveArr = _moves;
    }
    var pieceType = type ? typeFromAscii[type] : 1;
    if (castle) pieceType = 6;
    var fromFile = -1;
    var fromRank = -1;
    if (from) {
      if (from.length === 2) {
        fromFile = fileFromString[from[0]];
        fromRank = rankFromString[from[1]];
      } else if (from.length === 1) {
        if ('abcdefgh'.includes(from)) {
          fromFile = fileFromString[from[0]];
        } else if ('12345678'.includes(from)) {
          fromRank = rankFromString[from[0]];
        }
      }
    }
    var toSquare = squareFromString[to];
    var promotion = prom ? pieceFromAscii[prom] : 0;
    var i = start;
    var move,mfrom,mto,mcap,mcas,mprom;
    var board = position.board;
    var match = null;
    for (; i < end; i++) {
      move = moveArr[i];
      mfrom = move & 63; // Move.getFrom(move);
      mto = move >> 6 & 63; // Move.getTo(move);
      mcap = move << 13 >> 25; // Move.getCapture(move);
      mcas = move << 6 >> 25; // Move.getCastle(move);
      mprom = move >> 26; // Move.getProm(move);
      if (fromFile > -1) {
        if ((mfrom & 7) !== fromFile) continue;
      }
      if (fromRank > -1) {
        if ((mfrom >> 3) !== fromRank) continue;
      }
      if (mto !== toSquare) continue;
      if (
        Math.abs(board[mfrom]) !== pieceType &&
        !(fromFile > -1 && fromRank > -1)
      ) continue;
      if (mprom !== promotion) continue;
      match = move;
      break;
    }
    return match;
  }

  SAN.toFAN = function(san) {
    switch (san[0]) {
      case 'N': return '♞' + san.slice(1);
      case 'B': return '♝' + san.slice(1);
      case 'R': return '♜' + san.slice(1);
      case 'Q': return '♛' + san.slice(1);
      case 'K': return '♚' + san.slice(1);
      default : return san;
    }
  }

  return SAN;

})();