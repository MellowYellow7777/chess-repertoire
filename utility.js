var {max, min, round, floor, log10} = Math;

var dom = (tag, className='') => {
  var element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

var appendMany = (parent, ...children) => {
  children.forEach(child => parent.appendChild(child));
};

var appendRecursively = (elements) => {
  var parent = elements.shift();
  elements.forEach(child => {
    if (Array.isArray(child)) {
      child = appendRecursively(child);
    }
    parent.appendChild(child);
  });
  return parent;
}

function numberToString(n) {
  if (n < 1000) return n.toString();;
  var mag = floor(log10(n));
  mag = mag - mag % 3;
  n = n / 10**mag;
  n = n.toPrecision(3);
  mag /= 3;
  n += 'KMBT'[mag-1];
  return n;
}

function percentToString(n) {
  if (n < .005) return '0%';
  if (n < .1) return (round(n*100)/100).toFixed(2) + '%';
  if (n < 10) return n.toPrecision(2) + '%';
  return round(n).toString() + '%';
}