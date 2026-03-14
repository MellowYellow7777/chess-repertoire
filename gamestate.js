var GameState = (() => {

  function GameState(from, state) {
    var position = state ? state.position : Position.initial();
    var fen;
    // 'from' arugment may be...
    switch (typeof from) {
      // ...a fen string
      case 'string':
        fen = from;
        Position.fromFEN(fen, position);
        break;
      // ...left empty, defaulting to given state or initial position
      case 'undefined':
        from = position;
      // ...or a position object
      case 'object':
        Position.copyTo(from, position);
        fen = Position.toFEN(from);
        break;
      default:
        throw Error(`Cannot create GameState, invalid from argument`);
        break;
    }

    // moves are not saved per position, since there may be hundereds or even
    // thousands of nodes each representing a position. instead of attaching an
    // array onto each node, moves will be calculated and saved to a single
    // cache attached to the state. this happens any time a node is created. the
    // node will then be given a pointer and a length that says where its moves
    // are saved at in the cache. it will also be given the current state epoch.
    // the state.epoch increments every time the cache is flushed. so if the
    // node.epoch doesnt match the state.epoch, its moves will be recalculated
    // and pointers will be updated.
    var moves = state ? state.moves : new Int32Array(2048 + 256);
    var epoch = state ? state.epoch + 1 : 0;
    var movePtr = 0;
    var moveLen = LegalMoves(position, moves);
    // ufen : "unique fen", the same first three fields of the normal fen, with
    // the enpassant field replaced with the number of legal moves, which unlike
    // the normal enpassant field which is set whether there is a capture
    // available or not, is sufficient information to determine repetition.
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + moveLen;
    var result = '*';
    var resultType = null;
    var root = createNode(fen,movePtr,moveLen,epoch,result,resultType,{eco:'',opening:''});
    var line = [root];
    var current = root;
    var index = 0;
    // nodes maps ufens to nodes. when a move is made, the resulting positions
    // ufen can be looked up in this map to see if a node already exists with
    // that position. this way transpositions will share the same continuation.
    var nodes = state ? state.nodes : new Map();
    nodes.clear();
    nodes.set(ufen, root);

    state = state ?? {};
    state.position = position;
    state.fen = fen;
    state.moves = moves;
    state.epoch = epoch;
    state.movePtr = movePtr;
    state.moveLen = moveLen;
    state._movePtr = moveLen;
    state.result = result;
    state.resultType = resultType;
    state.root = root;
    state.line = line;
    state.current = current;
    state.index = index;
    state.nodes = nodes;

    if (DEBUG) addMethods(state);

    return state;
  }

  // oop style methods only for dev/debug usage. none of this these are used in
  // the code but are here for convienience sake nonetheless
  function addMethods(state) {
    state.fromFEN = fen => GameState(fen, state);
    state.fromPosition = position => GameState(position, state);
    state.syncNode = function(node) {
      if (arguments.length === 0) node = state.current;
      GameState.syncNode(state, node);
    }
    state.goTo = (index) => GameState.goTo(state, index);
    state.back = () => GameState.back(state);
    state.forward = () => GameState.forward(state);
    state.jumpBackToVariation = () => GameState.jumpBackToVariation(state);
    state.jumpForwardToVariation = () => GameState.jumpForwardToVariation(state);
    state.start = () => GameState.start(state);
    state.end = () => GameState.end(state);
    state.setVariation = function(forwardIndex, index) {
      if (arguments.length === 1) index = state.index - 1;
      GameState.setVariation(state, forwardIndex, index);
    }
    state.backVariation = function(index) {
      if (arguments.length === 0) index = state.index - 1;
      GameState.backVariation(state, index);
    }
    state.forwardVariation = function(index) {
      if (arguments.length === 0) index = state.index - 1;
      GameState.forwardVariation(state, index);
    }
    state.makeMove = (move, silent=false, hidden=false) =>
      GameState.makeMove(state, move, silent, hidden);
    state.deleteNode = (node) => GameState.deleteNode(state);
    state.getAllNodes = () => GameState.getAllNodes(state);
    state.getAllEdges = () => GameState.getAllEdges(state);
    state.getCurrentLine = () => GameState.getCurrentLine(state);
    state.getAllLines = () => GameState.getAllLines(state);
    state.export = () => GameState.export(state);
    state.import = (data) => GameState.import(state, data);
    state.getUFEN = () =>
      state.fen.split(' ').slice(0,3).join(' ') + ' ' + state.moveLen;
  }

  // legacy, the constructor now accepts fen
  GameState.fromFEN = GameState;

  GameState.syncNode = function(state, node = state.current) {
    var position = state.position;
    var moves = state.moves;
    var fen = node.fen;
    Position.fromFEN(fen, position);
    state.fen = fen;

    if (node.epoch === state.epoch) {
      // if epochs match, no need to recalculate moves,
      // just set the pointers
      state.movePtr = node.movePtr;
      state.moveLen = node.moveLen;
    } else {
      // otherwise they need to be recalculated
      if (state._movePtr > 2048) {
        // and flush cache in case of potential overflow
        state._movePtr = 0;
        state.epoch++;
      }
      state.movePtr = state._movePtr;
      state.moveLen = LegalMoves(position, moves, state.movePtr) - state.movePtr;
      state._movePtr += state.moveLen;
      node.movePtr = state.movePtr;
      node.moveLen = state.moveLen;
      node.epoch = state.epoch;
    }

    state.result = node.result;
    state.resultType = node.resultType;
    state.index = state.line.indexOf(node);
  }

  // go to the node at the given index in the current line
  GameState.goTo = function(state, index) {
    var line = state.line;
    state.index = index;
    state.current = line[index];
    if (index > 0) {
      var node = line[index - 1];
      audio.play(node.children[node.forwardIndex].audio);
    }
    GameState.syncNode(state);
  }

  // go backwards in current line by 1 move
  GameState.back = function(state) {
    var index = state.index;
    if (index === 0) return;
    // back from node B:
    // nA -> e1 -> nB
    // set current to node A,
    // and play the audio from edge 1
    // which is node As # forwardIndex child
    state.index = --index;
    var node = state.line[index];
    state.current = node;
    audio.play(node.children[node.forwardIndex].audio);
    GameState.syncNode(state);
  }

  // go forwards in current line by 1 move
  GameState.forward = function(state) {
    var index = state.index;
    if (index === state.line.length - 1) return;
    // forward from node A:
    // nA -> e1 -> nB
    // set current to node B,
    // and play the audio from edge 1
    // which is node As # forwardIndex child
    state.index = ++index;
    var node = state.current;
    audio.play(node.children[node.forwardIndex].audio);
    state.current = state.line[index];
    GameState.syncNode(state);
  }

  // go backwards in current line until a node with variations is reached
  // say we are at node D:
  // nA > e1 > nB > e2 > nC > ... > nD
  //              > e4 > nE > ...
  // we need to go back until we find a node with multiple children. node B
  // has 2 children, edges 2 and 4. we want to land on the node after it,
  // node C, and play the audio from edge 2.
  GameState.jumpBackToVariation = function(state) {
    var index = state.index;
    if (index === 0) return;
    if (index === 1) {
      GameState.back(state);
      return;
    }
    var line = state.line;
    var node = state.current;
    while (true) {
      node = line[--index];
      if (node.children.length > 1 || !(index > 0)) {
        state.current = node;
        state.index = index;
        audio.play(node.children[node.forwardIndex].audio);
        GameState.syncNode(state);
        return;
      }
    }
  }

  // go forwards in current line until a node with variations is reached
  GameState.jumpForwardToVariation = function(state) {
    var index = state.index;
    var line = state.line;
    if (index === line.length - 1) return; // last element
    if (index === line.length - 2) { // second to last element
      GameState.forward(state);
      return;
    }
    var prev = state.current;
    var node;
    while (true) {
      node = line[++index];
      if (node.children.length > 1 || (index >= line.length - 1)) {
        state.current = node;
        state.index = index;
        audio.play(prev.children[prev.forwardIndex].audio);
        GameState.syncNode(state);
        return;
      }
      prev = node;
    }
  }

  // go to the beginning of the current line
  GameState.start = function(state) {
    if (state.index === 0) return;
    state.index = 0;
    var node = state.line[0];
    state.current = node;
    audio.play(node.children[node.forwardIndex].audio);
    GameState.syncNode(state);
  }

  // go to the end of the current line
  GameState.end = function(state) {
    var index = state.line.length - 1;
    if (state.index === index) return;
    state.index = index;
    var node = state.line[index - 1];
    audio.play(node.children[node.forwardIndex].audio);
    state.current = state.line[index];
    GameState.syncNode(state);
  }

  GameState.syncLine = function(state, node) {
    if (!node.children) return;
    var line = state.line;
    var edge;
    while (node.children.length) {
      edge = node.children[node.forwardIndex];
      node = edge.child;
      line.push(node);
    }
  }

  GameState.setVariation = function(state, node, forwardIndex = node.forwardIndex) {
    node.forwardIndex = forwardIndex;
    GameState.syncLine(state, node);
    var edge = node.children[node.forwardIndex]
    state.current = edge.child;
    audio.play(edge.audio);
    GameState.syncNode(state);
  }

  GameState.backVariation = function(state, index = state.index - 1) {
    var line = state.line;
    if (index < 0) return;
    var node = line[index];
    var l = node.children.length;
    if (l < 2) return;
    var i = node.forwardIndex;
    node.forwardIndex = (((i - 1) % l) + l) % l;
    line.length = index + 1;
    GameState.syncLine(state, node);
    var edge = node.children[node.forwardIndex]
    state.current = edge.child;
    audio.play(edge.audio);
    GameState.syncNode(state);
  }

  GameState.forwardVariation = function(state, index = state.index - 1) {
    var line = state.line;
    if (index < 0) return;
    var node = line[index];
    var l = node.children.length;
    if (l < 2) return;
    node.forwardIndex = (node.forwardIndex + 1) % l;
    line.length = index + 1;
    GameState.syncLine(state, node);
    var edge = node.children[node.forwardIndex]
    state.current = edge.child;
    audio.play(edge.audio);
    GameState.syncNode(state);
  }

  GameState.makeMove = function(state, move, silent=false, hidden=false) {
    var current = state.current;
    var children = current.children;
    var line = state.line;

    // first, check if move already exists
    var i = 0;
    var l = children.length;
    var child;
    var match = false;
    for(; i < l; i++) {
      child = children[i];
      if (child.move !== move) continue;
      match = child;
      break;
    }

    if (match) {
      // if so, update pointers and goto
      state.index++;
      line.length = state.index;
      GameState.setVariation(state, current, i);
      return;
    }

    // no edge match, but not time to make a new edge yet
    // but will start collecting information about the move
    var nodes = state.nodes;
    var position = state.position;
    var san = SAN.fromMove(position, move);
    var moveType = 'move-self';
    var capture = move << 13 >> 25; // Move.getCapture(move);
    var castle = move << 6 >> 25; // Move.getCastle(move);
    var promotion = move >> 26; // Move.getProm(move);
    if (capture !== -1) moveType = 'capture';
    if (promotion !== 0) moveType = 'promote';
    if (castle !== -1) moveType = 'castle';

    // and resuting position
    Position.makeMove(position, move);
    var fen = Position.toFEN(position);
    state.fen = fen;

    // set cache pointers, get move len
    if (state._movePtr > 2048) {
      state._movePtr = 0;
      state.epoch++;
    }
    state.movePtr = state._movePtr;
    state.moveLen = LegalMoves(position, state.moves, state.movePtr) - state.movePtr;
    state._movePtr += state.moveLen;
    var epoch = state.epoch;
    var movePtr = state.movePtr;
    var moveLen = state.moveLen;

    // check for check
    var kingAt = position.turn === 1 ? position.wk : position.bk;
    var inCheck = LegalMoves.isInCheck(position.board, position.turn, kingAt);
    if (inCheck) moveType = 'move-check';

    // and now check if this position already exists
    // ufen is just 'unique' fen, first three fen fields + # moves
    // are enough information to determine eq positions
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + moveLen;

    if (nodes.has(ufen)) {
      // if position already exists,
      // first check to see if it exists in the current line
      var next = nodes.get(ufen);
      var index = line.indexOf(next);
      if (index > -1) {
        // if so, just goto and bail
        if (!silent) audio.play(moveType);
        GameState.goTo(state, index, true, hidden);
        return;
      }
      // found a match that is not a part of the current line,
      // so it is safe to create a new edge and point
      // to the existing node.
      var edge = createEdge(move,san,moveType,current,next);
      current.forwardIndex = children.length;
      children.push(edge);
      state.index++;
      GameState.setVariation(state, current);
      return;
    }

    // no position match found, so need to create new node
    // and finally can create an edge
    var edge = createEdge(move,san,moveType,current);
    current.forwardIndex = children.length;
    children.push(edge);

    // check for result if still undetermined
    var result = state.result;
    var resultType = state.resultType;
    if (result === '*') {
      // 50 move rule
      if (position.halfmoves > 100) {
        result = '1/2-1/2';
        resultType = '50-move rule';
      // mates
      } else if (moveLen === 0) {
        // checkmate
        if (inCheck) {
          if (position.turn === +1) result = '0-1';
          if (position.turn === -1) result = '1-0';
          resultType = 'checkmate';
          // stalemate
        } else {
          result = '1/2-1/2';
          resultType = 'stalemate';
        }
      // insufficient material
      } else {
        var i = 0, piece, wn = 0, bn = 0, wb = [0,0],  bb = [0,0];
        var minorFound = false, possible = false, p, pn;
        loop:
        for (; i < 64; i++) {
          p = (i + (i >> 3)) & 1;
          pn = 1 - p;
          piece = position.board[i];
          switch (piece) {
            case +1: case +4: case +5: case -1: case -4: case -5:
              possible = true;
              break loop;
            case +2:
              if (minorFound) {
                possible = true;
                break loop;
              }
              minorFound = true;
              wn++;
              break;
            case -2:
              if (minorFound) {
                possible = true;
                break loop;
              }
              minorFound = true;
              bn++;
              break;
            case +3:
              if (wn + bn + wb[pn] + bb[pn] > 0) {
                possible = true;
                break loop;
              }
              minorFound = true;
              wb[p]++;
              break;
            case -3:
              if (wn + bn + wb[pn] + bb[pn] > 0) {
                possible = true;
                break loop;
              }
              minorFound = true;
              bb[p]++;
              break;
          }
        }
        if (!possible) {
          result = '1/2-1/2';
          resultType = 'insufficient material';
        }
      }
    }

    state.result = result;
    state.resultType = resultType;

    var next = createNode(fen,movePtr,moveLen,epoch,result,resultType,current);
    nodes.set(ufen, next);
    edge.child = next;
    state.current = next;
    state.index++;
    line.length = state.index;
    line.push(next);

    if (!silent) audio.play(edge.audio);
    onEdit();
  }

  function createEdge(move,san,audio,parent=null,child=null) {
    var edge = {};
    edge.move = move;
    edge.san = san;
    edge.audio = audio;
    edge.parent = parent;
    edge.child = child;
    return edge;
  }

  function createNode(fen,movePtr,moveLen,epoch,result,resultType,current) {
    var node = {};
    node.fen = fen;
    node.movePtr = movePtr;
    node.moveLen = moveLen;
    node.epoch = epoch;
    node.result = result;
    node.resultType = resultType;
    node.forwardIndex = 0;
//  node.backwardIndex = 0;
//  node.parents = [];
    node.children = [];
    node.notes = '';
    var ufen = getUFEN(node);
    if (Openings.has(ufen)) {
      var [eco,opening] = Openings.get(ufen);
      node.eco = eco;
      node.opening = opening;
    } else {
      node.eco = current.eco;
      node.opening = current.opening;
    }
    return node;
  }

  function getUFEN(node) {
    return node.fen.split(' ').slice(0,3).join(' ') + ' ' + node.moveLen;
  }

  GameState.deleteNode = function(state,index) {
    if (index === 0) return;
    var line = state.line;
    var node = line[index];
    var parent = line[index-1];
    var ufen = node.fen.split(' ').slice(0,3).join(' ') + ' ' + node.moveLen;
    if (state.nodes.has(ufen)) state.nodes.delete(ufen);
    var edges = parent.children;
    var l = edges.length;
    var i = 0;
    var edge;
    var match = false;
    for (; i < l; i++) {
      edge = edges[i];
      if (edge.child === node) {
        match = true;
        break;
      }
    }

    if (match) {
      parent.children.splice(i, 1);
      if (parent.forwardIndex <= i) {
        parent.forwardIndex--;
      }
    }

    line.length = index;

    if (state.index >= index) {
      GameState.goTo(state, index - 1);
      GameState.syncLine(state, state.root);
    }
  }

  GameState.getAllNodes = function(state) {
    var iterator = state.nodes.entries();
    var nodes = [];
    for (entry of iterator) nodes.push(entry[1]);
    return nodes;
  }

  GameState.getAllEdges = function(state) {
    var iterator = state.nodes.entries();
    var edges = [];
    for (entry of iterator) edges.push(...entry[1].children);
    return edges;
  }

  GameState.getCurrentLine = function(state) {
    var node = state.root;
    var movetext = '';
    var i = 1;
    while (node.children.length) {
      var childEdges = node.children;
      var edge = childEdges[node.forwardIndex];
      var child = edge.child;
      var san = edge.san;
      i++;
      if (i % 2 === 0) {
        if (movetext.length) movetext += ' ';
        movetext += (i/2) + '.';
      }
      movetext += ' ';
      movetext += san;
      node = child;
    }
    if (movetext.length) movetext += ' ';
    movetext += node.result;
    return movetext;
  }

  GameState.getAllLines = function(state) {
    var q = [[state.root,'',1]];
    var lines = [];
    while (q.length) {
      var [node, movetext, i] = q.shift();
      var childEdges = node.children;
      if (!childEdges.length) {
        if (movetext.length) movetext += ' ';
        movetext += node.result;
        lines.push(movetext);
        continue;
      }
      i++;
      if (i % 2 === 0) {
        if (movetext.length) movetext += ' ';
        movetext += (i/2) + '.';
      }
      movetext += ' ';
      childEdges.forEach(edge => {
        var child = edge.child;
        var san = edge.san;
        q.push([child, movetext + san, i]);
      });
    }
    return lines;
  }

  GameState.export = function(state) {
    var root = state.root;
    if (!root) throw Error(`Export failed: root node is undefined`);
    var nodes = GameState.getAllNodes(state);
    var edges = GameState.getAllEdges(state);
    var rootIndex = nodes.indexOf(root);
    if (rootIndex < 0) throw Error(`Export failed: root node is missing from position map`);
    nodes.splice(rootIndex, 1);
    nodes.unshift(root);
    var data = {};
    data.root = root.fen;
    data.edges = [];
    data.notes = {};
    var nodeMap = new Map();
    nodes.forEach((node,id) => {
      nodeMap.set(node,id);
      var notes = node.notes;
      if (!notes) return;
      data.notes[id] = notes;
    });
    edges.forEach(edge =>
      data.edges.push(
        nodeMap.get(edge.parent),
        edge.move,
        nodeMap.get(edge.child),
      )
    );
    return data;
  }

  GameState.import = function(state, data) {
    if (typeof data === 'string') data = JSON.parse(data);
    GameState.fromFEN(data.root, state);
    var nodes = [state.root];
    for (var i = 0; i < data.edges.length;) {
      var from = data.edges[i++];
      var move = data.edges[i++];
      var to = data.edges[i++];
      state.current = nodes[from];
      GameState.syncNode(state, nodes[from]);
      state.line.length = 0;
      GameState.makeMove(state, move, true, true);
      nodes[to] = state.current;
    }
    for (var id in data.notes) nodes[id].notes = data.notes[id];
    for (var i = 0; i < nodes.length; i++) nodes[i].forwardIndex = 0;
    state.index = 0;
    state.current = state.root;
    state.line = [state.root];
    GameState.syncNode(state, state.root, true, true);
    GameState.syncLine(state, state.root);
  }

  return GameState;

})();


















