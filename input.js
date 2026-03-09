var Input = (() => {

  function clearKeyStates(input, keys) {
    var fn = input.onKeyUp;
    if (!fn) {
      keys.length = 0;
      return;
    }
    while(keys.length) {
      fn(keys.shift());
    }
  }

  var Input = function(element) {

    var input = {};

    var mouse = {};

    mouse.x = null;
    mouse.y = null;
    mouse.left = false;
    mouse.middle = false;
    mouse.right = false;

    var keys = [];

    input.mouse = mouse;
    input.keys = keys;

    input.onLeftDown = null;
    input.onMiddleDown = null;
    input.onRightDown = null;
    input.onLeftUp = null;
    input.onMiddleUp = null;
    input.onRightUp = null;
    input.onMouseMove = null;
    input.onKeyDown = null;
    input.onKeyUp = null;

    element.onpointerdown = function(event) {
      element.setPointerCapture(event.pointerId);
    }
    element.onpointerup = function(event) {
      element.releasePointerCapture(event.pointerId);
    }
    element.onpointermove = function(event) {
      mouse.x = event.offsetX;
      mouse.y = event.offsetY;
      input.onMouseMove?.(event);
    }

    element.onmousedown = function(event) {
      event.preventDefault();
      if (document.activeElement) document.activeElement.blur();
      var btns = event.buttons;
      mouse.left = (btns & 0b001) !== 0;
      mouse.right = (btns & 0b010) !== 0;
      mouse.middle = (btns & 0b100) !== 0;
      switch(event.button) {
        case 0: input.onLeftDown?.(event); break;
        case 1: input.onMiddleDown?.(event); break;
        case 2: input.onRightDown?.(event); break;
      }
    }

    element.onmouseup = function(event) {
      var btns = event.buttons;
      mouse.left = (btns & 0b001) !== 0;
      mouse.right = (btns & 0b010) !== 0;
      mouse.middle = (btns & 0b100) !== 0;
      switch(event.button) {
        case 0: input.onLeftUp?.(event); break;
        case 1: input.onMiddleUp?.(event); break;
        case 2: input.onRightUp?.(event); break;
      }
    }

    element.oncontextmenu = function(event) {
      event.preventDefault();
    }

    document.onkeydown = function(event) {
      if (event.metaKey) return;
      var key = event.code;
      input.onKeyDown?.(event);
      var i = 0;
      var l = keys.length;
      for (; i < l; i++) {
        if (keys[i] === key) return;
      var btns = event.buttons;
      mouse.left = (btns & 0b001) !== 0;
      }
      keys.push(key);
    }

    document.onkeyup = function(event) {
      var key = event.code;
      if (key.startsWith('Meta')) {
        clearKeyStates(input, keys);
        return;
      }
      var i = keys.indexOf(key);
      if (i > -1) {
        keys.splice(i,1);
        input.onKeyUp?.(event);
      }
    }

    window.onblur = function(event) {
      clearKeyStates(input, keys);
    }

    window.onfocus = function(event) {
      clearKeyStates(input, keys);
    }

    document.onvisibilitychange = function(event) {
      if (!document.hidden) return;
      clearKeyStates(input, keys);
    }

    return input;

  }

  return Input;

})();