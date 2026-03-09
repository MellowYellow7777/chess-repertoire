

var displayWrapper =    dom('div', 'movetext-display-wrapper');
var displayHeader =     dom('div', 'movetext-display-header');
var displayHeaderDesc = dom('div', 'movetext-display-header-desc');
var displayHeaderECO =  dom('div', 'movetext-display-header-eco');
var displayBody =       dom('div', 'movetext-display-body');
var displayGutter =     dom('div', 'movetext-display-gutter');
var fenInput =          dom('input', 'fen-input');
var nameInput =         dom('input', 'name-input');
var notes =             dom('textarea', 'notes-input');
var menuBar =           dom('div', 'menubar');
var nameBar =           dom('div', 'name-bar');
var fenBar =            dom('div', 'fen-bar');
var settingsBtn =       dom('img', 'name-bar-button settings');
var flipBtn =           dom('img', 'name-bar-button flip');
var saveBtn =           dom('img', 'name-bar-button save');
var copyBtn =           dom('img', 'fen-bar-button copy');
var dbSettingsBtn =     dom('img', 'db-header-button settings');
var dbToggleBtn =       dom('img', 'db-header-button toggle');
var dbResize =          dom('div', 'db-resize');

settingsBtn.src = './images/other/settings.svg';
dbSettingsBtn.src = './images/other/settings.svg';
flipBtn.src =     './images/other/flip.svg';
saveBtn.src =     './images/other/save.svg';
copyBtn.src =     './images/other/copy.svg';

fenInput.value = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

fenInput.placeholder =  'Enter FEN here...';
notes.placeholder =     'Enter notes about the position here...';
nameInput.placeholder = 'Untitled Repertoire';

dbResize.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  var iy = event.clientY;
  var ih = dbheight;
  var mx = window.innerHeight - 101;
  dbResize.onpointermove = function(event) {
    dbheight = round(min(mx, max(85, ih + iy - event.clientY)));
    if (dbheight === 85) dbResize.style.cursor = 'n-resize';
    else dbResize.style.cursor = 'ns-resize';
    resizeContent();
  }
}

dbResize.onpointerup = function(event) {
  this.releasePointerCapture(event.pointerId);
  dbResize.onpointermove = null;
}

fenInput.setAttribute('disabled', 'true');


function saveAs(name) {
  Files.save(name,GameState.export(state), () => console.log(`Saved "${name}" Successfully`));
}

var NAME = '';

function load(name) {
  Files.load(name, data => {
  GameState.import(state, data);
  Position.copyTo(state.position, ui.position);
  renderMoves(state);
  nameInput.value = name;
  NAME = name;
  });
}


var noteRegex = /{\s*annot\s*:\s*(.*?)\s*(?:}|,\s*color\s*:\s*(.*?)\s*})/gmi;

notes.oninput = function(event) {
  var value = event.target.value;
  state.current.notes = value;
  ui.noteAnnotations.length = 0;
  var match;
  while (match = noteRegex.exec(value)) {
    var [,annots,color] = match;
    if (!color) color = 'rgba(255, 170, 0, 0.8)';
    if (!isNaN(+color)) {
      color = [
        'rgba(255, 170, 0, 0.8)',
        'rgba(235, 97, 80, 0.8)',
        'rgba(172, 206, 89, 0.8)',
        'rgba(82, 176, 220, 0.8)',
        'rgba(196, 114, 255, 0.8)',
      ][+color] ?? 'rgba(255, 170, 0, 0.8)';
    }
    annots = annots.split(/\s+/);
    var i = 0;
    var l = annots.length;
    var a;
    for (;i < l;i++) {
      a = annots[i];
      if (!a.includes('-')) {
        a = Square.fromString(a);
        if (a > -1) {
          ui.noteAnnotations.push({type: 'square', from: a, to: a, color});
        }
        continue;
      } else {
        a = a.split('-');
        var j = 1;
        var prev = Square.fromString(a[0]);
        var jl = a.length;
        for (;j < jl;j++) {
          var from = prev;
          var to = Square.fromString(a[j]);
          var type = from === to ? 'square' : 'arrow';
          if (from > -1 && to > -1) {
            ui.noteAnnotations.push({type, from, to, color});
          }
          prev = to;
        }
      }
    }
  }
};

function createOpenWindow(keys) {
var w = new FloatingWindow2('Open');
w.body.innerHTML = '';
var wrapper = dom('div');
wrapper.style.height = 'calc(100% - 30px)';
wrapper.style.overflow = 'auto';
wrapper.style.border = '1px solid #404040';
wrapper.style.borderRadius = '4px';
var selEl = null;
var sel = null;
keys.forEach(key => {
var opt = dom('div');
opt.style.height = '24px';
opt.style.lineHeight = '24px';
opt.style.textIndent = '4px';
opt.style.userSelect = 'none';
opt.innerText = key;
opt.onclick = function(event) {
  ok.removeAttribute('disabled');
  del.removeAttribute('disabled');
  if (sel) {
    selEl.style.backgroundColor = 'transparent';
  }
  selEl = opt;
  sel = key;
  opt.style.backgroundColor = '#4088C8';
}
wrapper.appendChild(opt);
});
w.body.appendChild(wrapper);
var [ok] = w.addOkCancel(() => {
  load(sel);
  w.close();
}, w.close);
var del = w.addDelete(() => {
  makeSure('Are you sure you want to delete ' + sel + '?',
  () => {
    Files.delete(sel);
    selEl.remove();
    sel = null;
    selEl = null;
    ok.setAttribute('disabled', 'true');
    del.setAttribute('disabled', 'true');
  }, () => {});
});
ok.innerText = 'Open';
ok.setAttribute('disabled', 'true');
del.setAttribute('disabled', 'true');

}

function makeSure(text, yesAction, noAction) {
  var w = new FloatingWindow2('Open');
  w.body.innerText = text;
  w.minHeight = 90;
  w.resizable = false;
  w.element.style.height = '90px';
  var [ok,cancel] = w.addOkCancel(
    () => { yesAction(); w.close(); },
    () => { noAction(); w.close(); },
  );
  ok.innerText = 'Yes';
  cancel.innerText = 'No';
}

function askSave(callback) {
if (!canSave || !nameInput.value.length) {callback();return;}
var w = new FloatingWindow2('Open');
w.body.innerText = 'Do you want to save your current repetoire?';
w.minHeight = 90;
w.resizable = false;
w.element.style.height = '90px';
var [ok,cancel] = w.addOkCancel(() => {
save();
callback();
w.close();
}, () => {
callback();
w.close();
});
ok.innerText = 'Yes';
cancel.innerText = 'No';
}

var train = dom('div', 'menubar-button');
var file =  dom('div', 'menubar-button');
var edit =  dom('div', 'menubar-button');
var help =  dom('div', 'menubar-button');
var s1 =    dom('div', 'menubar-separator');
var s2 =    dom('div', 'menubar-separator');
var s3 =    dom('div', 'menubar-separator');
var s4 =    dom('div', 'menubar-separator');

train.innerText = 'Train';
file.innerText = 'File';
edit.innerText = 'Edit';
help.innerText = 'Help';

file.onclick = function() {
  var menu = ContextMenu.create(8 + file.offsetLeft, file.offsetHeight + 9);
  menu.addMenuItem('New', menu => {
    menu.destroy();
    Files.getKeys(keys => askSave(() => {
      GameState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', state);
      Position.copyTo(state.position, ui.position);
      renderMoves(state);
      nameInput.value = '';
      canSave = false;
    }
    ));
  });
  menu.addMenuItem('Open', menu => {
    menu.destroy();
    Files.getKeys(keys => askSave(() => createOpenWindow(keys)));
  });
  menu.addMenuItem('Save', menu => {
    menu.destroy();
  });
  menu.addMenuItem('Save As', menu => {
    menu.destroy();
  });
  menu.addLine();
  menu.addMenuItem('Import', menu => {
    menu.destroy();
  });
  menu.addMenuItem('Export', menu => {
    menu.destroy();
  });
}

train.onclick = function() {
  var menu = ContextMenu.create(8, train.offsetHeight + 9);
  if (opponent === TRAINING) {
    menu.addMenuItem('Stop Training', menu => {
      opponent = SELF;
      renderMoves(state);
      notes.disabled = false;
      dbwrapper.style.display = 'block';
      resizeContent();
      menu.destroy();
    });
  } else {
    menu.addMenuItem('Train', menu => {
      opponent = TRAINING;
      notes.disabled = true;
      dbwrapper.style.display = 'none';
      notes.value = '';
      GameState.start(state);
      Position.copyTo(state.position, ui.position);
      renderMoves(state);
      resizeContent();
      edges = state.current.children;
      if (edges.length !== 0) {
      ui.hint = edges[0].move & 63;
      showHint = performance.now() + 5000;
      }
      menu.destroy();
    });
  }
}

var canSave = false;
var onSave = null;
var oldName = '';

function onEdit() {
  if (opponent === TRAINING) return;
  if (!nameInput.value.length) return;
  if (canSave) return;
  saveBtn.style.opacity = '1';
  saveBtn.style.cursor = 'pointer';
  saveBtn.onclick = save;
  canSave = true;
}

function save() {
  if (opponent === TRAINING) return;
  var name = nameInput.value;
  if (!name) return;
  if (name === NAME) {
    Files.save(NAME,GameState.export(state), () => {
      canSave = false;
      saveBtn.style.opacity = '0.25';
      saveBtn.style.cursor = 'none';
      saveBtn.onclick = null;
    });
  } else {
    Files.load(NAME, data => {
      Files.save(name, data, () => {
        canSave = false;
        saveBtn.style.opacity = '0.25';
        saveBtn.style.cursor = 'none';
        saveBtn.onclick = null;
        Files.delete(NAME);
        NAME = name;
      });
    });
  }
}

nameInput.onchange = function() {
  nameInput.blur();
  onEdit();
}

nameInput.oninput = function() {
  onEdit();
}

copyBtn.onclick = async function() {
  var text = fenInput.value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    copyBtn.src = './images/other/save.svg';
    setTimeout(() => {
      copyBtn.src = './images/other/copy.svg';
    }, 1000);
  } else {
    var area = dom('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copyBtn.src = './images/other/save.svg';
    setTimeout(() => {
      copyBtn.src = './images/other/copy.svg';
    }, 1000);
  }
}

rerender = false;
var settingsOpen = false;
createSettingsWindow = function () {
if (settingsOpen) return;
var w = new FloatingWindow2('Settings');
settingsOpen = true;
w.element.children[0].style.borderBottom = '1px solid #404040';
w.element.children[0].style.backgroundColor = '#181818';
w.element.style.overflow = 'visible';
w.body.style.backgroundColor = '#202020';
var keys = Settings.getKeys('main');
for (var key of keys) {
  var value = Settings.getItem(key);
  var name = Settings.getName(key);
  var type = Settings.getType(key);
  if (type === 'checkbox') {
    (key => {
      w.addInput(w.body, name, 'checkbox', value, value => Settings.setItem(key, value));
    })(key);
  } else if (type === 'select') {
    (key => {
      var options = Settings.getOptions(key);
      w.addSelect(w.body, name, options, value, value => Settings.setItem(key, value));
    })(key);
  } else {
    (key => {
      w.addInput(w.body, name, type, value, value => Settings.setItem(key, value));
    })(key);
  }
}
w.onClose = () => settingsOpen = false;
}

settingsBtn.onclick = createSettingsWindow;
flipBtn.onclick = () => ui.flipBoard = !ui.flipBoard;




var dbSettingsOpen = false;
createDBSettingsWindow = function () {
if (dbSettingsOpen) return;
var w = new FloatingWindow2('Settings');
dbSettingsOpen = true;
w.element.children[0].style.borderBottom = '1px solid #404040';
w.element.children[0].style.backgroundColor = '#181818';
w.element.style.overflow = 'visible';
w.body.style.backgroundColor = '#202020';
var keys = Settings.getKeys('db');
for (var key of keys) {
  var value = Settings.getItem(key);
  var name = Settings.getName(key);
  var type = Settings.getType(key);
  if (type === 'checkbox') {
    (key => {
      w.addInput(w.body, name, 'checkbox', value, value => Settings.setItem(key, value));
    })(key);
  } else if (type === 'select') {
    (key => {
      var options = Settings.getOptions(key);
      w.addSelect(w.body, name, options, value, value => Settings.setItem(key, value));
    })(key);
  } else {
    (key => {
      w.addInput(w.body, name, type, value, value => Settings.setItem(key, value));
    })(key);
  }
}
w.onClose = () => {updateDB(); dbSettingsOpen = false; }
}

dbSettingsBtn.onclick = createDBSettingsWindow;
flipBtn.onclick = () => ui.flipBoard = !ui.flipBoard;





displayHeaderDesc.innerText = 'Starting Position';
displayHeaderECO.innerText = 'ECO: A00';


var dbMap = new Map();

var token = '';

var dbParams = new URLSearchParams;


var dbwrapper = dom('div', 'db-wrapper');
var dbheader = dom('div', 'db-header');
var dbbody = dom('div', 'db-body');
var dbheadertext = dom('div');
var dbselect = dom('select', 'db-select');
var dbheaderleft = dom('div', 'db-header-wrapper-left');
var dbheaderright = dom('div', 'db-header-wrapper-right');

Init.add(() => {
  if (config.database === 'Masters') {
    dbselect.innerHTML = `
      <option selected>Players</option>
      <option>Masters</option>`;
  } else {
    dbselect.innerHTML = `
      <option selected>Players</option>
      <option>Masters</option>`;
  }
  dbselect.onchange = function(event) {
    Settings.setItem('database', event.target.value);
    updateDB();
  }
});



dbheadertext.innerText = '\u00a0Database';
dbheight = 450;

dbToggleBtn.onclick = function(event) {
  if (dbOpen) closeDB();
  else openDB();
  resizeContent();
}

var dbOpen = false;

function openDB() {
  dbbody.style.display = '';
  dbOpen = true;
  dbToggleBtn.src = './images/other/down.svg';
  dbResize.style.display = '';
}

function closeDB() {
  dbbody.style.display = 'none';
  dbOpen = false;
  dbToggleBtn.src = './images/other/up.svg';
  dbResize.style.display = 'none';
}

closeDB();

function buildDB(d) {
  ms = process(d);
  dbbody.innerHTML = '';
  var dbmoves = dom('div', 'db-moves');
  dbbody.appendChild(dbmoves);
  ms.forEach((data,i) => {
    var last = i === ms.length - 1;
    var row = dom('div', last ? 'db-last-row' : 'db-row');
    var wrapperLeft = dom('div', 'db-wrapper-left');
    var wrapperRight = dom('div', 'db-wrapper-right');
    var mv = dom('div', 'db-move-text');
    var mvp = dom('div');
    var overbar = dom('div', 'db-row-overbar');
    var wp = dom('div');
    var dp = dom('div');
    var bp = dom('div');
    var bar = dom('div', 'db-row-bar');
    var barw = dom('div', 'db-row-bar-white');
    var barb = dom('div', 'db-row-bar-black');
    var dpm = data.percentage;
    var dpw = data.percentages.white;
    var dpd = data.percentages.draws;
    var dpb = data.percentages.black;
    if (!last) mvp.innerText = percentToString(dpm);
      wp.innerText = percentToString(dpw);
      dp.innerText = percentToString(dpd);
      bp.innerText = percentToString(dpb);
    mv.innerText = data.san;
    if (!last) {
      mv.onclick = function(event) {
        var move = SAN.toMove(state.position,data.san,state.moves,state.movePtr,state.movePtr+state.moveLen);
        if (move) {
          GameState.makeMove(ui.gamestate, move);
          renderMoves(ui.gamestate);
          Position.copyTo(ui.gamestate.position, ui.position);
        }
      }
    }
    row.onmouseover= function(event) {
      mvp.innerText = numberToString(data.total);
      wp.innerText = numberToString(data.white);
      dp.innerText = numberToString(data.draws);
      bp.innerText = numberToString(data.black);
    }
    row.onmouseout = function(event) {
      mvp.innerText = last ? '' : percentToString(dpm);
      wp.innerText = percentToString(dpw);
      dp.innerText = percentToString(dpd);
      bp.innerText = percentToString(dpb);
    }
    barw.style.width = dpw + '%';
    barb.style.width = dpb + '%';
    var parent = last ? dbbody : dbmoves;
    appendRecursively([parent, [row,
      [wrapperLeft, mv, mvp],
      [wrapperRight, 
        [overbar, wp, dp, bp],
        [bar, barw, barb],
      ]
    ]]);
  })
}

document.body.appendChild(dbwrapper);
dbwrapper.appendChild(dbheader);
dbwrapper.appendChild(dbbody);
appendRecursively([document.body,
  [menuBar, train, s1, file, s2, edit, s3, help, s4],
  [displayWrapper, 
    [displayHeader, displayHeaderDesc, displayHeaderECO],
    displayBody, displayGutter
  ],
  [fenBar, fenInput, copyBtn],
  [nameBar, nameInput, saveBtn, flipBtn, settingsBtn],
  notes,
  [dbwrapper, 
    [dbheader, 
      [dbheaderleft, dbselect, dbheadertext],
      [dbheaderright, dbSettingsBtn, dbToggleBtn],
    ], dbbody, dbResize,
  ],
]);


function renderMoves(state) {

  var fen = state.current.fen;
  var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + state.current.moveLen;

  if (state.current.eco) {
    displayHeaderECO.innerText = 'ECO: ' + state.current.eco;
  }
  if (state.current.opening) {
    displayHeaderDesc.innerText = state.current.opening;
  }

  var useFAN = config.pieceNotation;

  if (opponent === TRAINING) {
    notes.value = '';
    notes.placeholder =     'Notes are hidden during training. You can change this in the settings.';
  } else {
    notes.placeholder =     'Enter notes about the position here...';
    notes.value = state.current.notes;
    notes.oninput({target: notes});
  }
  fenInput.value = fen;

  displayBody.innerHTML = '';
  displayGutter.innerHTML = '';

  var line = state.line;
  var fullmove = 0;
  var row, num;
  var i = 0;
  var l = line.length;
  if (opponent === TRAINING) l = state.index+1;
  var last, node, edge;
  for (; i < l; i++) {
    if (i > 0) edge = last.children[last.forwardIndex];
    node = line[i];

    if (i % 2 === 1 || i === 0) {
      row = dom('div', 'movetext-row');
      num = dom('div', 'movetext-number');
      if (i === 0) {
        row.className += ' top-row';
        num.className += ' top-row';
      }
      num.textContent = fullmove + '';
      displayBody.appendChild(row);
      displayGutter.appendChild(num);
    }

    var cell = dom('div', 'movetext-cell');
    var variWrapper = dom('div', 'movetext-variation');
    var textWrapper = dom('div', 'movetext-text');
    var vari = dom('div', 'movetext-variation-content');
    var text = dom('div', 'movetext-text-content');

    if (last && last.children.length > 1 && opponent !== TRAINING) {
      variWrapper.className += ' active';
      vari.textContent = '[' + (last.forwardIndex + 1) + ']';
      variWrapper.onclick = createVariationHandler(state, i);
    }

    if (i === 0) {
      cell.className += ' root';
      text.className += ' root';
      text.textContent = 'root';
    } else {
      var txt = edge.san;
      if (useFAN) txt = SAN.toFAN(txt);
      text.textContent = txt;
    }
    textWrapper.onclick = createJumpHandler(state, i);
    textWrapper.oncontextmenu = createContextMenuHandler(state, i);
    if (state.current === node) {
    	textWrapper.className += ' active';
    }

    appendRecursively([row, [cell,
      [variWrapper, vari],
      [textWrapper, text],
    ]]);

    if (i % 2 === 0) fullmove++;

    last = node;
  }


  if (!dbOpen || opponent === TRAINING) return;

  if (dbMap.has(ufen)) {
    var data = dbMap.get(ufen);
     buildDB(data);
     return;
  }

  dbParams.set('fen', fen);
/*
  if (config.database === 'Masters') {
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + state.current.moveLen;
    fetch('https://explorer.lichess.org/masters?' + dbParams.toString(), {headers: { Authorization: `Bearer ${token}` }}).then(res => res.json()).then(data => {
      dbMap.set(ufen,data);
      buildDB(data);
    });
  } else {
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + state.current.moveLen;
    fetch('https://explorer.lichess.org/lichess?' + dbParams.toString(), {headers: { Authorization: `Bearer ${token}` }}).then(res => res.json()).then(data => {
      dbMap.set(ufen,data);
      buildDB(data);
    });
  }
*/
}



function updateDB() {
  dbMap.clear();
  var fen = state.current.fen;
  var p = dbParams;
  p.set('fen', fen);
  if (config.database === 'Masters') {
    var {dbSince, dbUntil, dbMoves} = config;
    dbParams.delete('since');
    dbParams.delete('until');
    if (dbSince) p.set('since',dbSince.split('-')[0]);
    if (dbUntil) p.set('until',dbUntil.split('-')[0]);
    if (dbMoves) p.set('moves',dbMoves);
    dbParams.delete('speeds');
    dbParams.delete('ratings');
    p.set('recentGames','0');
    p.set('topGames','0');
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + state.current.moveLen;
    /*
    fetch('https://explorer.lichess.org/masters?' + dbParams.toString(), {headers: { Authorization: `Bearer ${token}` }}).then(res => res.json()).then(data => {
      dbMap.set(ufen,data);
      buildDB(data);
    });
    */
  } else {
    var {dbSince, dbUntil, dbMoves,
      db0Rated, db1000Rated, db1200Rated,
      db1400Rated, db1600Rated, db1800Rated,
      db2000Rated, db2200Rated, db2500Rated,
      dbBlitz, dbBullet, dbClassical,
      dbCorrespondence, dbRapid, dbUltraBullet}
      = config;
    if (dbSince) p.set('since',dbSince);
    if (dbUntil) p.set('until',dbUntil);
    if (dbMoves) p.set('moves',dbMoves);
    var speeds = [];
    var ratings = [];
    if (dbUltraBullet) speeds.push('ultraBullet');
    if (dbBullet) speeds.push('bullet');
    if (dbBlitz) speeds.push('blitz');
    if (dbRapid) speeds.push('rapid');
    if (dbClassical) speeds.push('classical');
    if (dbCorrespondence) speeds.push('correspondence');
    if (db0Rated) ratings.push('0');
    if (db1000Rated) ratings.push('1000');
    if (db1200Rated) ratings.push('1200');
    if (db1400Rated) ratings.push('1400');
    if (db1600Rated) ratings.push('1600');
    if (db1800Rated) ratings.push('1800');
    if (db2000Rated) ratings.push('2000');
    if (db2200Rated) ratings.push('2200');
    if (db2500Rated) ratings.push('2500');
    if (speeds.length) p.set('speeds',speeds.join(','));
    if (ratings.length) p.set('ratings',ratings.join(','));
    p.set('topGames','0');
    p.set('recentGames','0');
    var ufen = fen.split(' ').slice(0,3).join(' ') + ' ' + state.current.moveLen;
    /*
    fetch('https://explorer.lichess.org/lichess?' + p.toString(), {headers: { Authorization: `Bearer ${token}` }}).then(res => res.json()).then(data => {
      dbMap.set(ufen,data);
      buildDB(data);
    });
    */
  }
}

function createJumpHandler(state, index) {
  return function () {
    GameState.goTo(state, index);
    Position.copyTo(state.position,ui.position);
    renderMoves(state);
  }
}

function createVariationHandler(state, index) {
  return function () {
    GameState.forwardVariation(state, index-1)
    Position.copyTo(state.position,ui.position);
    renderMoves(state);
  }
}

function createContextMenuHandler(state, index) {
  return function(event) {
    event.preventDefault();
    var menu = ContextMenu.create(event.clientX, event.clientY);
    var node = state.line[index];
    var parent = state.line[index];

    if (true || node.children.length === 0) {
      menu.addMenuItem('Delete', menu => {
        GameState.deleteNode(state, index);
        renderMoves(state);
        Position.copyTo(state.position, ui.position);
        menu.destroy();
        onEdit();
      });
    }


    menu.addMenuItem(`${index}`, menu => {console.log(node.parents[node.backwardIndex].san); menu.destroy();});



    
  }
}














function roundPercent(values) {

var ints = values.map(Math.floor)

var fractions = values.map(function(v, i){
  return v - ints[i]
})

var sum = ints[0] + ints[1] + ints[2]
var remaining = 100 - sum

while (remaining > 0) {

  var largestIndex = 0

  for (var i = 1; i < fractions.length; i++) {
    if (fractions[i] > fractions[largestIndex]) {
      largestIndex = i
    }
  }

  ints[largestIndex]++
  fractions[largestIndex] = 0
  remaining--

}

return ints;

}


function process(data) {
  var {white, draws, black} = data;
  var ttotal = white + draws + black;
  var moves = data.moves.map(data => {
    var {white, draws, black, san} = data;
    var total = white + draws + black;
    var move = {};
    move.san = san;
    move.white = white;
    move.draws = draws;
    move.black = black;
    move.total = total
    move.percentage = total / ttotal * 100;
    move.percentages = {
      white: white / total * 100,
      draws: draws / total * 100,
      black: black / total * 100,
    };
    return move;
  });
  moves.push({
    san: 'total',
    white, draws, black, total: ttotal,
    percentage: 100, percentages: {
      white: white / ttotal * 100,
      draws: draws / ttotal * 100,
      black: black / ttotal * 100,
    }}
  )
  return moves;
}







