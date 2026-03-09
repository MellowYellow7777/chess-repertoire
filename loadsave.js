var Files = (() => {

  var Files = {};

  var DB_NAME = 'repertoires';
  var DB_VERSION = 1;
  var STORE = 'files';

  var db;
  var transaction = null;

  var NOT_LOADED = -1;
  var LOADING = 0;
  var READY = 1;
  var BUSY = 2;
  var NOT_SUPPORTED = 3;

  Files.state = NOT_LOADED;

  function openDB() {
    Files.state = LOADING;
    var request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(event) {
      var db = event.target.result;
      if (!db.objectStoreNames.contains(STORE))
        db.createObjectStore(STORE);
    }

    request.onsuccess = function(event) {
      db = event.target.result;
      Files.save = saveDB;
      Files.load = loadDB;
      Files.delete = deleteFileDB;
      Files.getKeys = getKeysDB;
      Files.state = READY;
    }

    request.onerror = function(event) {
      Files.state = NOT_SUPPORTED;
      loadLS();
    }
  }

  openDB();

  var saves;

  function loadLS() {
    if (localStorage) {
      saves = localStorage.getItem('repertoires');
      if (saves) saves = JSON.parse(saves);
      else saves = {};
    } else saves = {};
    Files.save = saveLS;
    Files.load = loadLS;
    Files.delete = deleteFileLS;
    Files.getKeys = getKeysLS;
  }

  function writeLS() {
    if (localStorage) localStorage.setItem('repertoires',JSON.stringify(saves));
  }

  function saveLS(key, value, callback) {
    saves[key] = value;
    writeLS();
    if (callback) callback();
  }

  function loadLS(key, callback) {
    if (callback) callback(saves[key]);
  }

  function deleteFileLS(key, callback) {
    delete saves[key];
    writeLS();
    if (callback) callback();
  }

  function getKeysLS(callback) {
    if (callback) callback(Object.getOwnPropertyNames(saves));
  }

  function saveDB(key, value, callback) {
    if (Files.state !== READY) return; // throw?
    Files.state = BUSY;
    var tx = Files.transaction = db.transaction(STORE, 'readwrite');
    var request = tx.objectStore(STORE).put(value, key);
    request.onsuccess = function() {
      Files.state = READY;
      if (callback) callback();
    }
  }

  function loadDB(key, callback) {
    if (Files.state !== READY) return; // throw?
    Files.state = BUSY;
    var tx = Files.transaction = db.transaction(STORE, 'readonly');
    var request = tx.objectStore(STORE).get(key);
    request.onsuccess = function() {
      Files.state = READY;
      if (callback) callback(request.result);
    }
  }

  function deleteFileDB(key, callback) {
    if (Files.state !== READY) return; // throw?
    Files.state = BUSY;
    var tx = Files.transaction = db.transaction(STORE, 'readwrite');
    var request = tx.objectStore(STORE).delete(key);
    request.onsuccess = function() {
      Files.state = READY;
      if (callback) callback();
    }
  }

  function getKeysDB(callback) {
    if (Files.state !== READY) return; // throw?
    Files.state = BUSY;
    var tx = Files.transaction = db.transaction(STORE, 'readonly');
    var request = tx.objectStore(STORE).getAllKeys();
    request.onsuccess = function() {
      Files.state = READY;
      if (callback) callback(request.result);
    }
  }

  function cancel() {
    if (Files.transaction) Files.transaction.abort();
    Files.transaction = null;
  }

  Files.cancel = cancel;

  return Files;

})();