var Zobrist = (() => {

  var Zobrist = {};

  // "ZP" position high and low tables
  // 64 * 12 === # squares * # piece types
  var ZPH = (new Uint32Array(64 * 12)).map(PRNG);
  var ZPL = (new Uint32Array(64 * 12)).map(PRNG);

  // "ZC" castling high and low tables
  var ZCH = (new Uint32Array(16)).map(PRNG);
  var ZCL = (new Uint32Array(16)).map(PRNG);

  // "ZE" enpassant high and low tables
  var ZEH = (new Uint32Array(8)).map(PRNG);
  var ZEL = (new Uint32Array(8)).map(PRNG);

  // "ZT" "turn" or side to move high and low mask
  var ZTH = PRNG();
  var ZTL = PRNG();

  Zobrist.hash = function(position) {
    var board = position.board;
    var castling = position.castling;
    var enpassant = position.enpassant;

    // just initialize with castling value since it has no null value
    var hi = ZCH[castling];
    var lo = ZCL[castling];

    var i = 0;
    var piece;
    var zi;
    for (; i < 64; i++) {
      piece = board[i];
      if (piece) { // piece !== Piece.NULL
        zi = (piece & 15) << 6 | i;
        hi ^= ZPH[zi];
        lo ^= ZPL[zi];
      }
    }

    if (enpassant !== -1) { // enpassant !== Square.NULL
      zi = enpassant & 7;
      hi ^= ZEH[zi];
      lo ^= ZEL[zi];
    }

    if (position.turn === 1) { // position.turn === Color.WHITE
      hi ^= ZTH;
      lo ^= ZTL;
    }

    return [hi,lo];
  }

  Zobrist.update = function(hash, piece, from, to, capturePiece, captureSquare, ) {
    var [hi,lo] = hash;
    var zi = (piece & 15) << 6;
    hi ^= ZPH[zi | from];
    lo ^= ZPL[zi | from];
    hi ^= ZPH[zi | to];
    lo ^= ZPL[zi | to];
    if (capturePiece) {
      zi = (capturePiece & 15) << 6 | captureSquare;
      hi ^= ZPH[zi];
      lo ^= ZPL[zi];
    }
    return hash;
  }

})();






















