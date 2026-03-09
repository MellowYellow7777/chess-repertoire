var Init = (() => {

  var initializers = [];

  function Init() {
    initializers.forEach(fn => fn());
  }

  Init.add = function(initializer) {
    if (typeof initializer !== 'function')
      throw Error('Init.add argument must be a function');
    initializers.push(initializer);
  }

  return Init;

})();