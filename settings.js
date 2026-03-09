var Settings = (() => {

  var Settings = {};

  var local = location.protocol === 'file:';

  var storageKey = 'settings';

  if (local) {
    storageKey += location.href.split('').map(c => c.charCodeAt()).reduce((a,v) => (a<<1)^v);
  }

  var config = {
    darkSquares: '#B08060',
    lightSquares: '#F0D0B0',
    moveHighlight: '#FFFF30',
    coordinates: 'None',
    pieceNotation: 'Text',
    moveClassification: 'Default',
    pieceAnimations: 'Medium',
    highlightMoves: true,
    showLegalMoves: true,
  };

  Settings.config = config;

  var _keys = [];
  var _cats = {};
  var _names = {};
  var _types = {};
  var _defaults = {};
  var _settings = {};
  var _options = {};
  var _handlers = {};

  function createSetting(cat, name, key, type, values, def, handler = null) {
    _keys.push(key);
    _cats[key] = cat;
    _names[key] = name;
    _types[key] = type;
    _defaults[key] = def;
    _settings[key] = def;
    _options[key] = values;
    _handlers[key] = handler;
  }

/*
  createSetting('Board Style', 'boardStyle', 'select', ['Green', 'Wood', 'Glass', 'Brown', 'Icy Sea', 'Newspaper', 'Walnut', 'Sky', 'Lolz', 'Stone', 'Bases', '8-Bit', 'Marble', 'Purple', 'Translucent', 'Metal', 'Tournament', 'Dash', 'Burled Wood', 'Dark Blue', 'Bubblegum', 'Checkers', 'Graffiti', 'Light', 'Neon', 'Orange', 'Overlay', 'Parchment', 'Red', 'Sand', 'Tan', 'Blue', 'Pink', 'Chess The Musical'], 'Brown', images.setBoardStyle);
*/

  createSetting('main', 'Light Squares', 'lightSquares', 'color', null, '#F0D0B0', value => config.lightSquares = value);

  createSetting('main', 'Dark Squares', 'darkSquares', 'color', null, '#B08060', value => config.darkSquares = value);

  createSetting('main', 'Show Coordinates', 'coordinates', 'checkbox', [false,true], true, value => config.coordinates = value);

  createSetting('main', 'Show Legal Moves', 'showLegalMoves', 'checkbox', [false,true], true, value => config.showLegalMoves = value);

  createSetting('main', 'Highlight Moves', 'highlightMoves', 'checkbox', [false,true], true, value => config.highlightMoves = value);

  createSetting('main', 'Move Highlight', 'moveHighlight', 'color', null, '#FFFF30', value => config.moveHighlight = value);

  createSetting('main', 'Piece Style', 'pieceStyle', 'select', ['FreeSerif', 'Arial Unicode MS', 'Symbola', 'Chess (font)', 'DejaVu Sans', 'Gothic A1', 'Pecita', 'Nishiki Teki'/* 'Neo', 'Neo Angle', 'Game Room', 'Wood', 'Glass', 'Gothic', 'Classic', 'Metal', 'Bases', 'Neo-Wood', 'Icy Sea', 'Club', 'Ocean', 'Newspaper', 'Blindfold', 'Space', 'Cases', 'Condal', '3D - ChessKid', '8-Bit', 'Marble', 'Book', 'Alpha', 'Bubblegum', 'Dash', 'Graffiti', 'Light', 'Lolz', 'Luca', 'Maya', 'Modern', 'Nature', 'Neon', 'Sky', 'Tigers', 'Tournament', 'Vintage', '3D - Wood', '3D - Staunton', '3D - Plastic'], 'Neo',*/], 'FreeSerif', images.setPieceStyle);

  createSetting('main', 'Sound Theme', 'soundTheme', 'select', ['Default', 'Nature', 'Metal', 'Marble', 'Space', 'Beat', 'Silly', 'Lolz', 'Newspaper', 'Pebbles', 'Events - Esports World Cup', 'Chess The Musical', 'RuneScape - Bentnoze and Wartface', 'RuneScape - Vannaka & Wise Old Man', 'RuneScape - Bob the Cat', 'RuneScape - Sliske'], 'Default', audio.setTheme);

  createSetting('main', 'Figurine Notation', 'pieceNotation', 'checkbox', [false,true], false, value => {config.pieceNotation = value; renderMoves(state)});

  createSetting('main', 'Play Sounds', 'playSounds', 'checkbox', [false,true], true, value => audio.mute = !value);

  createSetting('db', 'Database', 'database', 'select', ['Masters','Players'], 'Players', value => config.database = value);
  createSetting('db', 'Year From', 'dbSince', 'month', null, '1952-01', value => config.dbSince = value);
  createSetting('db', 'Year To', 'dbUntil', 'month', null, '3000-12', value => config.dbUntil = value);
  createSetting('db', 'Moves', 'dbMoves', 'number', null, 12, value => config.dbMoves = value);
  createSetting('db', 'Ultra-Bullet', 'dbUltraBullet', 'checkbox', [false, true], false, value => config.dbUltraBullet = value);
  createSetting('db', 'Bullet', 'dbBullet', 'checkbox', [false, true], false, value => config.dbBullet = value);
  createSetting('db', 'Blitz', 'dbBlitz', 'checkbox', [false, true], true, value => config.dbBlitz = value);
  createSetting('db', 'Rapid', 'dbRapid', 'checkbox', [false, true], true, value => config.dbRapid = value);
  createSetting('db', 'Classical', 'dbClassical', 'checkbox', [false, true], true, value => config.dbClassical = value);
  createSetting('db', 'Correspondence', 'dbCorrespondence', 'checkbox', [false, true], false, value => config.dbCorrespondence = value);
  createSetting('db', '0-1000 Rating', 'db0Rated', 'checkbox', [false, true], false, value => config.db0Rated = value);
  createSetting('db', '1000-1200 Rating', 'db1000Rated', 'checkbox', [false, true], true, value => config.db1000Rated = value);
  createSetting('db', '1200-1400 Rating', 'db1200Rated', 'checkbox', [false, true], true, value => config.db1200Rated = value);
  createSetting('db', '1400-1600 Rating', 'db1400Rated', 'checkbox', [false, true], true, value => config.db1400Rated = value);
  createSetting('db', '1600-1800 Rating', 'db1600Rated', 'checkbox', [false, true], true, value => config.db1600Rated = value);
  createSetting('db', '1800-2000 Rating', 'db1800Rated', 'checkbox', [false, true], true, value => config.db1800Rated = value);
  createSetting('db', '2000-2200 Rating', 'db2000Rated', 'checkbox', [false, true], true, value => config.db2000Rated = value);
  createSetting('db', '2200-2500 Rating', 'db2200Rated', 'checkbox', [false, true], true, value => config.db2200Rated = value);
  createSetting('db', '2500+ Rating', 'db2500Rated', 'checkbox', [false, true], true, value => config.db2500Rated = value);

  


  Settings.setDefaults = function() {
    var i = 0;
    var l = _keys.length;
    var key;
    for (; i < l; i++) {
      key = _keys[i];
      Settings.setItem(key, _defaults[key]);
    }
  }

  Settings.load = function() {
    try {
      var saved = localStorage.getItem(storageKey);
      saved = JSON.parse(saved);
      var keys = Object.keys(saved);
      var i = 0;
      var l = keys.length;
      var key;
      for (; i < l; i++) {
        key = keys[i];
        Settings.setItem(key, saved[key]);
      }
    } catch (error) {
      Settings.setDefaults();
      Settings.save();
      return;
    }
  }

  Settings.save = function() {
    localStorage.setItem(storageKey,JSON.stringify(_settings));
  }

  Settings.setItem = function(key, value) {
    if (!_keys.includes(key)) return;
    if (!_options[key] === null && !_options[key].includes(value)) return;
    _settings[key] = value;
    Settings[key] = value;
    var handler = _handlers[key];
    if (handler) handler(value);
    Settings.save();
  }

  Settings.getItem = function(key) {
    if (!_keys.includes(key)) return undefined;
    return _settings[key];
  }

  Settings.getAll = function(cat=false) {
    var copy = {};
    var i = 0;
    var l = _keys.length;
    var key;
    for (; i < l; i++) {
      key = _keys[i];
      if (!cat || _cats[key] === cat)
        copy[key] = _settings[key];
    }
    return copy;
  }

  Settings.getKeys = function(cat=false) {
    if (!cat) return _keys.slice();
    return _keys.filter(key => _cats[key] === cat);
  }

  Settings.getName = function(key) {
    if (!_keys.includes(key)) return undefined;
    return _names[key];
  }

  Settings.getType = function(key) {
    if (!_keys.includes(key)) return undefined;
    return _types[key];
  }

  Settings.getOptions = function(key) {
    if (!_keys.includes(key)) return undefined;
    return _options[key].slice();
  }

  Settings.getDefault = function(key) {
    if (!_keys.includes(key)) return undefined;
    return _defaults[key];
  }

  return Settings;

})();