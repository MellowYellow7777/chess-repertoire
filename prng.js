var PRNG = (() =>  {
  // xoshiro128**

  var imul = Math.imul;
  var s1 = 0x0d605541;
  var s2 = 0x273d04f9;
  var s3 = 0xea1261bd;
  var s4 = 0xbbf13d53;
  var r;
  var t;

  return function() {
    r = imul(s2, 5);
    r = imul(r << 7 | r >>> 25, 9) >>> 0;

    t = s2 << 9;

    s3 ^= s1;
    s4 ^= s2;
    s2 ^= s3;
    s1 ^= s4;
    s3 ^= t;

    s4 = s4 << 11 | s4 >>> 21;

    return r;
  };

})();