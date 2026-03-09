var min = Math.min;
var max = Math.max;

class FloatingWindow {
  constructor(title, label, initial) {
    this.title = title;
    this.label = label;
    this.initial = initial;
    this.minWidth = 182;
    this.minHeight = 95;

    var windowElement = document.createElement('div');
    document.body.appendChild(windowElement);
    this.windowElement = windowElement;
    windowElement.style = `
      width: 300px;
      height: 100px;
      background-color: #2E2E2E;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 50px;
      left: 50%;
      z-index: 1000;
      border-radius: 6px;
    `;


    var header = document.createElement('div');
    windowElement.appendChild(header);
    header.style = `
      background-color: #3C3C3C;
      width: 100%;
      height: 22px;
      position: absolute;
      left: 0px;
      top: 0px;
      border-left: 1px solid #646464;
      border-top: 1px solid #858585;
      border-right: 1px solid #646464;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      box-sizing: border-box;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    var closeButton = document.createElement('div');
    header.appendChild(closeButton);
    closeButton.style = `
      width: 12px;
      height: 12px;
      border-radius: 6px;
      position: absolute;
      left: 7px;
      top: 4px;
      background-color: #FF564E;
    `;

    closeButton.onclick = () => this.removeWindow();
    closeButton.onpointerdown = (e) => e.stopPropagation();

    var titleElement = document.createElement('h2');
    header.appendChild(titleElement);
    titleElement.innerText = this.title;
    titleElement.style = `
      margin: 0;
      font-size: 16px;
      flex-grow: 1;
      text-align: center;
      font: 14px Roboto;
    `;


    var div = document.createElement('div');
    windowElement.appendChild(div);
    div.style = `
      width: 100%;
      height: 1px;
      border-left: 1px solid #333333;
      border-right: 1px solid #333333;
      background-color: #000000;
      position: absolute;
      left: 0px;
      top: 22px;
      box-sizing: border-box;
    `;

    var body = document.createElement('div');
    windowElement.appendChild(body);
    body.style = `
      position: absolute;
      bottom: 0px;
      left: 0px;
      width: 100%;
      height: calc(100% - 22px);
      border-left: 1px solid #4B4B4B;
      border-bottom: 1px solid #565656;
      border-right: 1px solid #565656;
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
      box-sizing: border-box;
      overflow: auto;
    `;

    var labelElement = document.createElement('label');
    body.appendChild(labelElement);
    labelElement.setAttribute('for', 'textInput');
    labelElement.innerText = this.label;
    labelElement.style = `
      color: white;
      font: 14px Roboto;
      position: absolute;
      top: 17px;
      left: 10px;
    `;

    var labelWidth = labelElement.offsetWidth;

    var inputElement = document.createElement('input');
    this.inputElement = inputElement;
    body.appendChild(inputElement);
    inputElement.type = 'text';
    inputElement.value = this.initial;
    inputElement.style = `
      position: absolute;
      top: 15px;
      right: 10px;
      width: calc(100% - ${labelWidth + 30}px);
      background-color: #383838;
      color: white;
      border-top: 1px solid #444444;
      border-bottom: 1px solid #4F4F4F;
      border-left: 1px solid #3F3F3F;
      border-right: 1px solid #3F3F3F;
      height: 20px;
      outline: none;
    `;

    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submit(inputElement.value);
        this.removeWindow();
      }
    });

    var buttonContainer = document.createElement('div');
    body.appendChild(buttonContainer);
    buttonContainer.style = 'text-align: right;';

    var cancelButton = document.createElement('button');
    buttonContainer.appendChild(cancelButton);
    cancelButton.innerText = 'Cancel';
    cancelButton.style = `
      width: 70px;
      height: 21px;
      position: absolute;
      bottom: 8px;
      right: 96px;
      border: 1px solid #242424;
      box-sizing: border-box;
      color: white;
      background-color: #626262;
      border-radius: 4px;
    `;
    cancelButton.onclick = () => this.removeWindow();

    var okButton = document.createElement('button');
    buttonContainer.appendChild(okButton);
    okButton.innerText = 'OK';
    okButton.style = `
      width: 70px;
      height: 21px;
      position: absolute;
      bottom: 8px;
      right: 14px;
      border: 1px solid #242424;
      box-sizing: border-box;
      color: white;
      background-color: #626262;
      border-radius: 4px;
    `;
    okButton.onclick = () => {
      this.submit(inputElement.value);
      this.removeWindow();
    }





    let offsetX = 0, offsetY = 0;

    header.onpointerdown = (e) => {
      e.preventDefault();
      offsetX = e.clientX - this.windowElement.offsetLeft;
      offsetY = e.clientY - this.windowElement.offsetTop;

      header.setPointerCapture(e.pointerId);

      header.onpointermove = (e) => {
        e.preventDefault();
        this.windowElement.style.left = `${e.clientX - offsetX}px`;
        this.windowElement.style.top = `${e.clientY - offsetY}px`;
      };

      header.onpointerup = (e) => {
        header.releasePointerCapture(e.pointerId);
        header.onpointermove = null;
        header.onpointerup = null;
      };
    };


// Resizing logic
const createResizer = (direction) => {
  const resizer = document.createElement('div');
  resizer.classList.add('resizer', direction);
  this.windowElement.appendChild(resizer);

  // Adjust cursor and position based on the direction
  let cursor, styles = {};
  if (direction === 'top') {
    cursor = 'n-resize';
    styles = { top: '0', left: '0', right: '0', height: '5px' };
  } else if (direction === 'bottom') {
    cursor = 's-resize';
    styles = { bottom: '0', left: '0', right: '0', height: '5px' };
  } else if (direction === 'left') {
    cursor = 'w-resize';
    styles = { top: '0', left: '0', bottom: '0', width: '5px' };
  } else if (direction === 'right') {
    cursor = 'e-resize';
    styles = { top: '0', right: '0', bottom: '0', width: '5px' };
  } else if (direction === 'top-right') {
    cursor = 'ne-resize';
    styles = { top: '0', right: '0', width: '10px', height: '10px' };
  } else if (direction === 'top-left') {
    cursor = 'nw-resize';
    styles = { top: '0', left: '0', width: '10px', height: '10px' };
  } else if (direction === 'bottom-right') {
    cursor = 'se-resize';
    styles = { bottom: '0', right: '0', width: '10px', height: '10px' };
  } else if (direction === 'bottom-left') {
    cursor = 'sw-resize';
    styles = { bottom: '0', left: '0', width: '10px', height: '10px' };
  }

  Object.assign(resizer.style, {
    position: 'absolute',
    backgroundColor: 'transparent',
    cursor: cursor,
    zIndex: '1001',
    ...styles,
  });

  resizer.onpointerdown = (e) => {
    e.preventDefault();

    const originalWidth = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('width').replace('px', ''));
    const originalHeight = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('height').replace('px', ''));
    const originalX = e.pageX;
    const originalY = e.pageY;
    const originalLeft = this.windowElement.offsetLeft;
    const originalTop = this.windowElement.offsetTop;

    const onPointerMove = (e) => {
      if (direction.includes('right')) {
        const width = max(this.minWidth, originalWidth + (e.pageX - originalX));
        this.windowElement.style.width = `${width}px`;
      }
      if (direction.includes('bottom')) {
        const height = max(this.minHeight, originalHeight + (e.pageY - originalY));
        this.windowElement.style.height = `${height}px`;
      }
      if (direction.includes('left')) {
        const width = max(this.minWidth, originalWidth - (e.pageX - originalX));
        if (width > this.minWidth) {
          this.windowElement.style.width = `${width}px`;
          this.windowElement.style.left = `${originalLeft + (e.pageX - originalX)}px`;
        }
      }
      if (direction.includes('top')) {
        const height = max(this.minHeight, originalHeight - (e.pageY - originalY));
        if (height > this.minHeight) {
          this.windowElement.style.height = `${height}px`;
          this.windowElement.style.top = `${originalTop + (e.pageY - originalY)}px`;
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };
};

// Add resizers for all edges and corners
createResizer('top');
createResizer('bottom');
createResizer('left');
createResizer('right');
createResizer('top-right');
createResizer('top-left');
createResizer('bottom-right');
createResizer('bottom-left');


    inputElement.focus();
  }

  submit(value) {

  }

  removeWindow() {
    document.body.removeChild(this.windowElement);
  }
}

class FloatingTextSaveWindow {
  constructor(title, bodyText) {
    this.title = title;
    this.bodyText = bodyText;
    this.minWidth = 300;
    this.minHeight = 150;

    var windowElement = document.createElement('div');
    document.body.appendChild(windowElement);
    this.windowElement = windowElement;
    windowElement.style = `
      width: 400px;
      height: 200px;
      background-color: #2E2E2E;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 50px;
      left: 50%;
      z-index: 1000;
      border-radius: 6px;
    `;

    var header = document.createElement('div');
    windowElement.appendChild(header);
    header.style = `
      background-color: #3C3C3C;
      width: 100%;
      height: 22px;
      position: absolute;
      left: 0px;
      top: 0px;
      border-left: 1px solid #646464;
      border-top: 1px solid #858585;
      border-right: 1px solid #646464;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      box-sizing: border-box;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    var closeButton = document.createElement('div');
    header.appendChild(closeButton);
    closeButton.style = `
      width: 12px;
      height: 12px;
      border-radius: 6px;
      position: absolute;
      left: 7px;
      top: 4px;
      background-color: #FF564E;
    `;
    closeButton.onclick = () => this.removeWindow();
    closeButton.onpointerdown = (e) => e.stopPropagation();

    var titleElement = document.createElement('h2');
    header.appendChild(titleElement);
    titleElement.innerText = this.title;
    titleElement.style = `
      margin: 0;
      font-size: 16px;
      flex-grow: 1;
      text-align: center;
      font: 14px Roboto;
    `;

    var body = document.createElement('div');
    windowElement.appendChild(body);
    body.style = `
      position: absolute;
      top: 23px;
      left: 0px;
      width: 100%;
      height: calc(100% - 70px);
      padding: 10px;
      box-sizing: border-box;
      color: white;
      font: 14px Roboto;
      overflow: hidden;
    `;
    body.innerText = this.bodyText;

    var buttonContainer = document.createElement('div');
    windowElement.appendChild(buttonContainer);
    buttonContainer.style = `
      position: absolute;
      bottom: 8px;
      left: 0;
      width: 100%;
      text-align: right;
      padding-right: 14px;
    `;

    ['Cancel', 'Don\'t Save', 'Save'].forEach((action) => {
      var button = document.createElement('button');
      buttonContainer.appendChild(button);
      button.innerText = action;
      button.style = `
        margin-left: 5px;
        width: 80px;
        height: 25px;
        border: 1px solid #242424;
        box-sizing: border-box;
        color: white;
        background-color: #626262;
        border-radius: 4px;
      `;
      button.onclick = () => this.handleAction(action);
    });

    let offsetX = 0, offsetY = 0;
    header.onpointerdown = (e) => {
      e.preventDefault();
      offsetX = e.clientX - this.windowElement.offsetLeft;
      offsetY = e.clientY - this.windowElement.offsetTop;

      header.setPointerCapture(e.pointerId);
      header.onpointermove = (e) => {
        e.preventDefault();
        this.windowElement.style.left = `${e.clientX - offsetX}px`;
        this.windowElement.style.top = `${e.clientY - offsetY}px`;
      };
      header.onpointerup = (e) => {
        header.releasePointerCapture(e.pointerId);
        header.onpointermove = null;
        header.onpointerup = null;
      };
    };

    const createResizer = (direction) => {
      const resizer = document.createElement('div');
      resizer.classList.add('resizer', direction);
      this.windowElement.appendChild(resizer);

      let cursor, styles = {};
      if (direction === 'top') {
        cursor = 'n-resize';
        styles = { top: '0', left: '0', right: '0', height: '5px' };
      } else if (direction === 'bottom') {
        cursor = 's-resize';
        styles = { bottom: '0', left: '0', right: '0', height: '5px' };
      } else if (direction === 'left') {
        cursor = 'w-resize';
        styles = { top: '0', left: '0', bottom: '0', width: '5px' };
      } else if (direction === 'right') {
        cursor = 'e-resize';
        styles = { top: '0', right: '0', bottom: '0', width: '5px' };
      } else if (direction === 'top-right') {
        cursor = 'ne-resize';
        styles = { top: '0', right: '0', width: '10px', height: '10px' };
      } else if (direction === 'top-left') {
        cursor = 'nw-resize';
        styles = { top: '0', left: '0', width: '10px', height: '10px' };
      } else if (direction === 'bottom-right') {
        cursor = 'se-resize';
        styles = { bottom: '0', right: '0', width: '10px', height: '10px' };
      } else if (direction === 'bottom-left') {
        cursor = 'sw-resize';
        styles = { bottom: '0', left: '0', width: '10px', height: '10px' };
      }

      Object.assign(resizer.style, {
        position: 'absolute',
        backgroundColor: 'transparent',
        cursor: cursor,
        zIndex: '1001',
        ...styles,
      });

      resizer.onpointerdown = (e) => {
        e.preventDefault();

        const originalWidth = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('width').replace('px', ''));
        const originalHeight = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('height').replace('px', ''));
        const originalX = e.pageX;
        const originalY = e.pageY;
        const originalLeft = this.windowElement.offsetLeft;
        const originalTop = this.windowElement.offsetTop;

        const onPointerMove = (e) => {
          if (direction.includes('right')) {
            const width = Math.max(this.minWidth, originalWidth + (e.pageX - originalX));
            this.windowElement.style.width = `${width}px`;
          }
          if (direction.includes('bottom')) {
            const height = Math.max(this.minHeight, originalHeight + (e.pageY - originalY));
            this.windowElement.style.height = `${height}px`;
          }
          if (direction.includes('left')) {
            const width = Math.max(this.minWidth, originalWidth - (e.pageX - originalX));
            if (width > this.minWidth) {
              this.windowElement.style.width = `${width}px`;
              this.windowElement.style.left = `${originalLeft + (e.pageX - originalX)}px`;
            }
          }
          if (direction.includes('top')) {
            const height = Math.max(this.minHeight, originalHeight - (e.pageY - originalY));
            if (height > this.minHeight) {
              this.windowElement.style.height = `${height}px`;
              this.windowElement.style.top = `${originalTop + (e.pageY - originalY)}px`;
            }
          }
        };

        const onPointerUp = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      };
    };

    createResizer('top');
    createResizer('bottom');
    createResizer('left');
    createResizer('right');
    createResizer('top-right');
    createResizer('top-left');
    createResizer('bottom-right');
    createResizer('bottom-left');
  }

  handleAction(action) {
    if (action === 'Cancel') {
      this.cancel();
    } else if (action === 'Don\'t Save') {
      this.dontSave();
    } else if (action === 'Save') {
      this.save();
    }
  }

  cancel() {
    this.removeWindow();
  }
  save() {
    this.removeWindow();
  }
  dontSave() {
    this.removeWindow();
  }

  removeWindow() {
    document.body.removeChild(this.windowElement);
  }
}


class FloatingTextArea {
  constructor(title, initial) {
    this.title = title;
    this.initial = initial;
    this.minWidth = 182;
    this.minHeight = 95;

    var windowElement = document.createElement('div');
    document.body.appendChild(windowElement);
    this.windowElement = windowElement;
    windowElement.style = `
      width: 800px;
      height: 800px;
      background-color: #2E2E2E;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 50px;
      left: 20%;
      z-index: 1000;
      border-radius: 6px;
    `;


    var header = document.createElement('div');
    windowElement.appendChild(header);
    header.style = `
      background-color: #3C3C3C;
      width: 100%;
      height: 22px;
      position: absolute;
      left: 0px;
      top: 0px;
      border-left: 1px solid #646464;
      border-top: 1px solid #858585;
      border-right: 1px solid #646464;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      box-sizing: border-box;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    var closeButton = document.createElement('div');
    header.appendChild(closeButton);
    closeButton.style = `
      width: 12px;
      height: 12px;
      border-radius: 6px;
      position: absolute;
      left: 7px;
      top: 4px;
      background-color: #FF564E;
    `;

    closeButton.onclick = () => this.removeWindow();
    closeButton.onpointerdown = (e) => e.stopPropagation();

    var titleElement = document.createElement('h2');
    header.appendChild(titleElement);
    titleElement.innerText = this.title;
    titleElement.style = `
      margin: 0;
      font-size: 16px;
      flex-grow: 1;
      text-align: center;
      font: 14px Roboto;
    `;


    var div = document.createElement('div');
    windowElement.appendChild(div);
    div.style = `
      width: 100%;
      height: 1px;
      border-left: 1px solid #333333;
      border-right: 1px solid #333333;
      background-color: #000000;
      position: absolute;
      left: 0px;
      top: 22px;
      box-sizing: border-box;
    `;

    var body = document.createElement('div');
    windowElement.appendChild(body);
    body.style = `
      position: absolute;
      bottom: 0px;
      left: 0px;
      width: 100%;
      height: calc(100% - 22px);
      border-left: 1px solid #4B4B4B;
      border-bottom: 1px solid #565656;
      border-right: 1px solid #565656;
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
      box-sizing: border-box;
    `;

    var area = document.createElement('textarea');
    body.appendChild(area);

    area.style = `
      position: absolute;
      top: 0px;
      left: 0px;
      width: 100%;
      height: 100%;
      outline: none;
      border: none;
      color: white;
      font: 14px monospace;
      background-color: #1E1E1E;
      resize: none;
    `;

    area.value = initial;


    enableTabToIndent(area);
/*
    new ResizeObserver(entries => {
      windowElement.style.width = `calc(${area.style.width} + 2px)`;
      windowElement.style.height = `calc(${area.style.height} + 24px)`;
    }).observe(area);
*/
    area.onkeydown = function(event) {
      event.stopPropagation();
    }

    var buttonContainer = document.createElement('div');
    body.appendChild(buttonContainer);
    buttonContainer.style = 'text-align: right;';

    var cancelButton = document.createElement('button');
    buttonContainer.appendChild(cancelButton);
    cancelButton.innerText = 'Cancel';
    cancelButton.style = `
      width: 70px;
      height: 21px;
      position: absolute;
      bottom: 8px;
      right: 96px;
      border: 1px solid #242424;
      box-sizing: border-box;
      color: white;
      background-color: #626262;
      border-radius: 4px;
    `;
    cancelButton.onclick = () => this.removeWindow();

    var okButton = document.createElement('button');
    buttonContainer.appendChild(okButton);
    okButton.innerText = 'OK';
    okButton.style = `
      width: 70px;
      height: 21px;
      position: absolute;
      bottom: 8px;
      right: 14px;
      border: 1px solid #242424;
      box-sizing: border-box;
      color: white;
      background-color: #626262;
      border-radius: 4px;
    `;
    okButton.onclick = () => {
      this.submit(area.value);
      this.removeWindow();
    }





    let offsetX = 0, offsetY = 0;

    header.onpointerdown = (e) => {
      e.preventDefault();
      offsetX = e.clientX - this.windowElement.offsetLeft;
      offsetY = e.clientY - this.windowElement.offsetTop;

      header.setPointerCapture(e.pointerId);

      header.onpointermove = (e) => {
        e.preventDefault();
        this.windowElement.style.left = `${e.clientX - offsetX}px`;
        this.windowElement.style.top = `${e.clientY - offsetY}px`;
      };

      header.onpointerup = (e) => {
        header.releasePointerCapture(e.pointerId);
        header.onpointermove = null;
        header.onpointerup = null;
      };
    };



// Resizing logic
const createResizer = (direction) => {
  const resizer = document.createElement('div');
  resizer.classList.add('resizer', direction);
  this.windowElement.appendChild(resizer);

  // Adjust cursor and position based on the direction
  let cursor, styles = {};
  if (direction === 'top') {
    cursor = 'n-resize';
    styles = { top: '0', left: '0', right: '0', height: '5px' };
  } else if (direction === 'bottom') {
    cursor = 's-resize';
    styles = { bottom: '0', left: '0', right: '0', height: '5px' };
  } else if (direction === 'left') {
    cursor = 'w-resize';
    styles = { top: '0', left: '0', bottom: '0', width: '5px' };
  } else if (direction === 'right') {
    cursor = 'e-resize';
    styles = { top: '0', right: '0', bottom: '0', width: '5px' };
  } else if (direction === 'top-right') {
    cursor = 'ne-resize';
    styles = { top: '0', right: '0', width: '10px', height: '10px' };
  } else if (direction === 'top-left') {
    cursor = 'nw-resize';
    styles = { top: '0', left: '0', width: '10px', height: '10px' };
  } else if (direction === 'bottom-right') {
    cursor = 'se-resize';
    styles = { bottom: '0', right: '0', width: '10px', height: '10px' };
  } else if (direction === 'bottom-left') {
    cursor = 'sw-resize';
    styles = { bottom: '0', left: '0', width: '10px', height: '10px' };
  }

  Object.assign(resizer.style, {
    position: 'absolute',
    backgroundColor: 'transparent',
    cursor: cursor,
    zIndex: '1001',
    ...styles,
  });

  resizer.onpointerdown = (e) => {
    e.preventDefault();

    const originalWidth = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('width').replace('px', ''));
    const originalHeight = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('height').replace('px', ''));
    const originalX = e.pageX;
    const originalY = e.pageY;
    const originalLeft = this.windowElement.offsetLeft;
    const originalTop = this.windowElement.offsetTop;

    const onPointerMove = (e) => {
      if (direction.includes('right')) {
        const width = max(this.minWidth, originalWidth + (e.pageX - originalX));
        this.windowElement.style.width = `${width}px`;
      }
      if (direction.includes('bottom')) {
        const height = max(this.minHeight, originalHeight + (e.pageY - originalY));
        this.windowElement.style.height = `${height}px`;
      }
      if (direction.includes('left')) {
        const width = max(this.minWidth, originalWidth - (e.pageX - originalX));
        if (width > this.minWidth) {
          this.windowElement.style.width = `${width}px`;
          this.windowElement.style.left = `${originalLeft + (e.pageX - originalX)}px`;
        }
      }
      if (direction.includes('top')) {
        const height = max(this.minHeight, originalHeight - (e.pageY - originalY));
        if (height > this.minHeight) {
          this.windowElement.style.height = `${height}px`;
          this.windowElement.style.top = `${originalTop + (e.pageY - originalY)}px`;
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };
};

// Add resizers for all edges and corners
createResizer('top');
createResizer('bottom');
createResizer('left');
createResizer('right');
createResizer('top-right');
createResizer('top-left');
createResizer('bottom-right');
createResizer('bottom-left');


    area.focus();
  }

  submit(value) {

  }

  removeWindow() {
    document.body.removeChild(this.windowElement);
  }
}



class FloatingItemListWindow {
  constructor(title, items) {
    this.title = title;
    this.loc = items;
    var ismap = items instanceof Map;
    this.items = ismap ? items.keys() : Object.keys(items);
    this.minWidth = 300;
    this.minHeight = 200;

    var windowElement = document.createElement('div');
    document.body.appendChild(windowElement);
    this.windowElement = windowElement;
    windowElement.style = `
      width: 400px;
      height: 300px;
      background-color: #2E2E2E;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 50px;
      left: 50%;
      z-index: 1000;
      border-radius: 6px;
    `;

    var header = document.createElement('div');
    windowElement.appendChild(header);
    header.style = `
      background-color: #3C3C3C;
      width: 100%;
      height: 22px;
      position: absolute;
      left: 0px;
      top: 0px;
      border-left: 1px solid #646464;
      border-top: 1px solid #858585;
      border-right: 1px solid #646464;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      box-sizing: border-box;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    var closeButton = document.createElement('div');
    header.appendChild(closeButton);
    closeButton.style = `
      width: 12px;
      height: 12px;
      border-radius: 6px;
      position: absolute;
      left: 7px;
      top: 4px;
      background-color: #FF564E;
    `;
    closeButton.onclick = () => this.removeWindow();
    closeButton.onpointerdown = (e) => e.stopPropagation();

    var titleElement = document.createElement('h2');
    header.appendChild(titleElement);
    titleElement.innerText = this.title;
    titleElement.style = `
      margin: 0;
      font-size: 16px;
      flex-grow: 1;
      text-align: center;
      font: 14px Roboto;
    `;

    var div = document.createElement('div');
    windowElement.appendChild(div);
    div.style = `
      width: 100%;
      height: 1px;
      border-left: 1px solid #333333;
      border-right: 1px solid #333333;
      background-color: #000000;
      position: absolute;
      left: 0px;
      top: 22px;
      box-sizing: border-box;
    `;

    var body = document.createElement('div');
    windowElement.appendChild(body);
    body.style = `
      position: absolute;
      top: 23px;
      left: 0px;
      width: 100%;
      height: calc(100% - 70px);
      border-left: 1px solid #4B4B4B;
      border-bottom: 1px solid #565656;
      border-right: 1px solid #565656;
      box-sizing: border-box;
      overflow-y: hidden;
    `;

    var itemElements = [];
    this.itemElements = itemElements;


    var scroll = 0;
    var sh = 26 * this.items.length;
    var oh = body.offsetHeight - 1;
    var sf = sh / oh;
    var sbh = oh / sf;
    var ms = sh - oh;
    var msb = oh - sbh;

    this.initItemElements = function() {
      itemElements.forEach(e => e.remove());
      itemElements.length = 0;
      this.items.forEach((item, index) => {
        var itemElement = document.createElement('div');
        itemElements.push(itemElement);
        body.appendChild(itemElement);
        itemElement.innerText = item;
        var desc = (ismap ? this.loc.get(item) : this.loc[item]).settings?.description;
        if (desc) itemElement.innerText += ' - ' + desc;
        itemElement.style = `
          color: white;
          cursor: pointer;
          font: 14px Roboto;
          width: 100%;
          display: flex;
          align-items: center;
          text-indent: 10px;
          height: 26px;
          position: absolute;
          overflow-x: hidden;
          text-wrap: nowrap;
        `;
        itemElement.style.top = 26*index-scroll*ms + 'px';
        itemElement.onclick = () => this.selectItem(index);
      });
    }

    this.initItemElements();

    function scrollItems(offy) {
      itemElements.forEach((ie,i) => {
        ie.style.top = (26*i - offy) + 'px';
      });
    }

    body.onwheel = function(event) {
        scroll += event.deltaY/ms/4;
        scrollItems(scroll * ms);
    }

    var track = document.createElement('div');
    body.appendChild(track);
    track.style = `
      background-color: #2B2B2B;
      border-left: 1px solid #3E3E3E;
      position: absolute;
      top: 0px;
      right: 0px;
      height: 100%;
      width: 14px;
      box-sizing: border-box;
      z-index: 1;
    `;

    var thumbwrapper = document.createElement('div');
    track.appendChild(thumbwrapper);
    thumbwrapper.style = `
      width: 13px;
      right: 0px;
      position: absolute;
      top: 0px;
    `;


    this.scrollTo = function(s) {
      sroll = s;
    }
    this.getScroll = function() {
      return scroll;
    }


    thumbwrapper.style.height = sbh + 'px';

    var scrollCalc = () => {
      sh = 26 * this.items.length;
      oh = body.offsetHeight - 1;
      sf = sh / oh;
      sbh = oh / sf;
      ms = sh - oh;
      msb = oh - sbh;
      thumbwrapper.style.height = sbh + 'px';
      thumbwrapper.style.top = scroll*msb + 'px';
      if (ms > 0) {
        track.removeAttribute('hidden');
      } else {
        track.setAttribute('hidden',true);
      }
    }

    this.scrollCalc = scrollCalc;

    if (ms > 0) {
      track.removeAttribute('hidden');
    } else {
      track.setAttribute('hidden',true);
    }

    var thumb = document.createElement('div');
    thumbwrapper.appendChild(thumb);
    thumb.style = `
      width: 10px;
      height: calc(100% - 4px);
      background-color: #6B6B6B;
      border: 1px solid #232323;
      border-radius: 5px;
      position: absolute;
      top: 2px;
      left: 2px;
      box-sizing: border-box;
    `;

    thumbwrapper.onpointerdown = function(event) {
      event.stopPropagation();
      this.setPointerCapture(event.pointerId);
      var iy = this.offsetTop;
      var imy = event.y;
      this.onpointermove = function(event) {
        var ny = iy + event.y - imy;
        ny = clamp(0, ny, msb);
        this.style.top = ny + 'px';
        scroll = ny / msb;
        scrollItems(scroll * ms);
      }
      this.onpointerup = function(event) {
        this.releasePointerCapture(event.pointerId);
        this.onpointermove = null;
        this.onpointerup = null;
      }
    }



    var buttonContainer = document.createElement('div');
    windowElement.appendChild(buttonContainer);
    buttonContainer.style = `
      position: absolute;
      bottom: 8px;
      left: 0;
      width: 100%;
      text-align: right;
      padding-right: 14px;
    `;

    ['Delete', 'Duplicate', 'Rename', 'Open'].forEach((action) => {
      var button = document.createElement('button');
      buttonContainer.appendChild(button);
      button.innerText = action;
      button.style = `
        margin-left: 5px;
        width: 80px;
        height: 25px;
        border: 1px solid #242424;
        box-sizing: border-box;
        color: white;
        background-color: #626262;
        border-radius: 4px;
      `;
      button.onclick = () => this.handleAction(action);
    });

    let offsetX = 0, offsetY = 0;
    header.onpointerdown = (e) => {
      e.preventDefault();
      offsetX = e.clientX - this.windowElement.offsetLeft;
      offsetY = e.clientY - this.windowElement.offsetTop;

      header.setPointerCapture(e.pointerId);
      header.onpointermove = (e) => {
        e.preventDefault();
        this.windowElement.style.left = `${e.clientX - offsetX}px`;
        this.windowElement.style.top = `${e.clientY - offsetY}px`;
      };
      header.onpointerup = (e) => {
        header.releasePointerCapture(e.pointerId);
        header.onpointermove = null;
        header.onpointerup = null;
      };
    };

    this.selectedItemIndex = null;

    // Resizing logic
    const createResizer = (direction) => {
      const resizer = document.createElement('div');
      resizer.classList.add('resizer', direction);
      this.windowElement.appendChild(resizer);

      let cursor, styles = {};
      if (direction === 'top') {
        cursor = 'n-resize';
        styles = { top: '-2.5', left: '0', right: '0', height: '5px' };
      } else if (direction === 'bottom') {
        cursor = 's-resize';
        styles = { bottom: '-2.5', left: '0', right: '0', height: '5px' };
      } else if (direction === 'left') {
        cursor = 'w-resize';
        styles = { top: '0', left: '-2.5', bottom: '0', width: '5px' };
      } else if (direction === 'right') {
        cursor = 'e-resize';
        styles = { top: '0', right: '-2.5', bottom: '0', width: '5px' };
      } else if (direction === 'top-right') {
        cursor = 'ne-resize';
        styles = { top: '-5', right: '-5', width: '10px', height: '10px' };
      } else if (direction === 'top-left') {
        cursor = 'nw-resize';
        styles = { top: '-5', left: '-5', width: '10px', height: '10px' };
      } else if (direction === 'bottom-right') {
        cursor = 'se-resize';
        styles = { bottom: '-5', right: '-5', width: '10px', height: '10px' };
      } else if (direction === 'bottom-left') {
        cursor = 'sw-resize';
        styles = { bottom: '-5', left: '-5', width: '10px', height: '10px' };
      }

      Object.assign(resizer.style, {
        position: 'absolute',
        backgroundColor: 'transparent',
        cursor: cursor,
        zIndex: '1001',
        ...styles,
      });

      resizer.onpointerdown = (e) => {
        e.preventDefault();

        const originalWidth = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('width').replace('px', ''));
        const originalHeight = parseFloat(getComputedStyle(this.windowElement, null).getPropertyValue('height').replace('px', ''));
        const originalX = e.pageX;
        const originalY = e.pageY;
        const originalLeft = this.windowElement.offsetLeft;
        const originalTop = this.windowElement.offsetTop;

        const onPointerMove = (e) => {
          if (direction.includes('right')) {
            const width = Math.max(this.minWidth, originalWidth + (e.pageX - originalX));
            this.windowElement.style.width = `${width}px`;
          }
          if (direction.includes('bottom')) {
            const height = Math.max(this.minHeight, originalHeight + (e.pageY - originalY));
            this.windowElement.style.height = `${height}px`;
          }
          if (direction.includes('left')) {
            const width = Math.max(this.minWidth, originalWidth - (e.pageX - originalX));
            if (width > this.minWidth) {
              this.windowElement.style.width = `${width}px`;
              this.windowElement.style.left = `${originalLeft + (e.pageX - originalX)}px`;
            }
          }
          if (direction.includes('top')) {
            const height = Math.max(this.minHeight, originalHeight - (e.pageY - originalY));
            if (height > this.minHeight) {
              this.windowElement.style.height = `${height}px`;
              this.windowElement.style.top = `${originalTop + (e.pageY - originalY)}px`;
            }
          }
          if (direction.includes('top') || direction.includes('bottom')) {
            scrollCalc();
          }
        };

        const onPointerUp = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      };
    };

    // Add resizers for all edges and corners
    createResizer('top');
    createResizer('bottom');
    createResizer('left');
    createResizer('right');
    createResizer('top-right');
    createResizer('top-left');
    createResizer('bottom-right');
    createResizer('bottom-left');
  }

  selectItem(index) {
    if (this.selectedItemIndex !== null) {
      this.itemElements[this.selectedItemIndex].style.backgroundColor = '';
    }
    this.selectedItemIndex = index;
    this.itemElements[index].style.backgroundColor = '#444';
  }

  handleAction(action) {
    if (this.selectedItemIndex === null) return;
    var selectedItem = this.items[this.selectedItemIndex];
    if (action === 'Delete') {
      if (!saves) saves = JSON.parse(decompress(localStorage.getItem('saves')));
      delete saves[this.items[this.selectedItemIndex]];
      localStorage.setItem('saves',compress(JSON.stringify(saves)));
      this.items.splice(this.selectedItemIndex, 1);
      this.initItemElements();
      this.scrollCalc();
      var index = this.selectedItemIndex;
      this.selectedItemIndex = null;
      this.selectItem(index-1);
    } else if (action === 'Duplicate') {
      if (!saves) saves = JSON.parse(decompress(localStorage.getItem('saves')));
      var name = this.items[this.selectedItemIndex];
      var newname = name;
      function nextnewname(name) {
        return name.match(/copy \d+$/) ? name.replace(/(\d+)$/, function(match) { return parseInt(match) + 1; }) : name.match(/copy$/) ? name + ' 2' : name + ' copy';
      }
      do {
        newname = nextnewname(newname);
      } while (newname in saves)
      saves[newname] = saves[name];
      localStorage.setItem('saves',compress(JSON.stringify(saves)));
      this.items.splice(this.selectedItemIndex + 1, 0, newname);
      this.initItemElements();
      this.scrollCalc();
      var index = this.selectedItemIndex;
      this.selectedItemIndex = null;
      this.selectItem(index+1);
    } else if (action === 'Rename') {
      if (!saves) saves = JSON.parse(decompress(localStorage.getItem('saves')));
      var name = this.items[this.selectedItemIndex];
      var w = new FloatingWindow('Rename ' + name,'Name: ', name);
      w.submit = newname => {
        if (newname in saves) {
          alert('name already taken');
          return;
        }
        saves[newname] = saves[name];
        delete saves[name];
        this.items[this.selectedItemIndex] = newname;
        localStorage.setItem('saves',compress(JSON.stringify(saves)));
        this.initItemElements();
      }
    } else if (action === 'Open') {
      var name = this.items[this.selectedItemIndex];
      load(name);
      this.removeWindow();
    }
  }

  removeWindow() {
    document.body.removeChild(this.windowElement);
  }
}








class FloatingWindow2 {

  constructor(title) {

var w = document.createElement('div'),
    tb = document.createElement('div'),
    tt = document.createElement('div'),
    rb = document.createElement('div'),
    bd = document.createElement('div'),
    l = document.createElement('div'),
    r = document.createElement('div'),
    t = document.createElement('div'),
    b = document.createElement('div'),
    tl = document.createElement('div'),
    tr = document.createElement('div'),
    bl = document.createElement('div'),
    br = document.createElement('div');
l.style.zIndex = r.style.zIndex = t.style.zIndex = b.style.zIndex = 
tl.style.zIndex = tr.style.zIndex = bl.style.zIndex = br.style.zIndex = '999';
l.style.position = r.style.position = t.style.position = b.style.position =
tl.style.position = tr.style.position = bl.style.position = br.style.position =
rb.style.position = 'absolute';
l.style.height = r.style.height = t.style.width = b.style.width = 'calc(100% - 12px)';
l.style.left = r.style.right = t.style.top = b.style.bottom = '-4px';
l.style.top = r.style.top = t.style.left = b.style.left = '6px';
l.style.width = r.style.width = t.style.height = b.style.height = '8px';
tl.style.top = tl.style.left = tr.style.top = tr.style.right =
bl.style.bottom = bl.style.left = br.style.bottom = br.style.right = '-6px';
tl.style.width = tl.style.height = tr.style.width = tr.style.height =
bl.style.width = bl.style.height = br.style.width = br.style.height = '12px';
l.style.cursor = r.style.cursor = 'ew-resize';
t.style.cursor = b.style.cursor = 'ns-resize';
tl.style.cursor = br.style.cursor = 'nwse-resize';
tr.style.cursor = bl.style.cursor = 'nesw-resize';
rb.style.width = rb.style.height = '12px';
rb.style.borderRadius = '6px';
rb.style.top = '5px';
rb.style.left = '6px';
rb.style.backgroundColor = '#f00';
tt.innerText = title;

var _resizable = true;

Object.defineProperty(this, 'resizable', {
  get() {return _resizable;},
  set(resizable) {
    if (resizable === _resizable) return;
    _resizable = resizable;
    if (resizable) {
l.style.display = r.style.display = t.style.display = b.style.display =
tl.style.display = tr.style.display = bl.style.display = br.style.display = '';
    } else {
l.style.display = r.style.display = t.style.display = b.style.display =
tl.style.display = tr.style.display = bl.style.display = br.style.display = 'none';
    }
  }
});

tt.style = `
  position: absolute;
  top: 0px;
  right: 0px;
  height: 22px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  user-select: none;
`;

w.className = 'floating-window';
tb.className = 'floating-window-top';
tt.className = 'floating-window-title';
bd.className = 'floating-window-body';

document.body.appendChild(w);
w.appendChild(tb);
w.appendChild(bd);
tb.appendChild(tt);
tb.appendChild(rb);
w.appendChild(l);
w.appendChild(r);
w.appendChild(t);
w.appendChild(b);
w.appendChild(tl);
w.appendChild(tr);
w.appendChild(bl);
w.appendChild(br);

this.minWidth = 325;
this.minHeight = 171;
this.resizable = true;

var x,y,ix,iy,ol,ot,ow,oh,nl,nt,nw,nh;

var reposition = event => {
  x = event.clientX;
  y = event.clientY;
  nl = ol + x - ix;
  nt = ot + y - iy;
  w.style.left = (nl | 0) + 'px';
  w.style.top = (nt |  0) + 'px';
}
var  resizeLeft = event => {
  x = event.clientX;
  nl = ol + x - ix;
  nw = ow - x + ix;
  if (nw < this.minWidth) nl = ol + ow - (nw = this.minWidth);
  w.style.left = (nl | 0) + 'px';
  w.style.width = (nw | 0) + 'px';
}
var  resizeTop = event => {
  y = event.clientY;
  nt = ot + y - iy;
  nh = oh - y + iy;
  if (nh < this.minHeight) nt = ot + oh - (nh = this.minHeight);
  w.style.top = (nt | 0) + 'px';
  w.style.height = (nh | 0) + 'px';
}
var  resizeRight = event => {
  x = event.clientX;
  nw = ow + x - ix;
  if (nw < this.minWidth) nw = this.minWidth;
  w.style.width = (nw | 0) + 'px';
}
var  resizeBottom = event => {
  y = event.clientY;
  nh = oh + y - iy;
  if (nh < this.minHeight) nh = this.minHeight;
  w.style.height = (nh | 0) + 'px';
}

rb.onclick = () => this.close();
rb.onpointerdown = function(event) {
    event.stopPropagation();
};
tb.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  ix = event.clientX;
  iy = event.clientY;
  ol = w.offsetLeft;
  ot = w.offsetTop;
  this.onpointermove = reposition;
}

l.onpointerup = r.onpointerup = t.onpointerup = b.onpointerup =
tl.onpointerup = tr.onpointerup = bl.onpointerup = br.onpointerup =
tb.onpointerup =
function(event) {
  this.releasePointerCapture(event.pointerId);
  this.onpointermove = null;
}

l.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  ix = event.clientX;
  ol = w.offsetLeft;
  ow = w.offsetWidth;
  this.onpointermove = resizeLeft;
}
r.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  ix = event.clientX;
  ow = w.offsetWidth;
  this.onpointermove = resizeRight;
}
t.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  iy = event.clientY;
  ot = w.offsetTop;
  oh = w.offsetHeight;
  this.onpointermove = resizeTop;
}
b.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  iy = event.clientY;
  oh = w.offsetHeight;
  this.onpointermove = resizeBottom;
}
tl.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  ix = event.clientX;
  iy = event.clientY;
  ol = w.offsetLeft;
  ot = w.offsetTop;
  ow = w.offsetWidth;
  oh = w.offsetHeight;
  this.onpointermove = function(event) {
    resizeTop(event);
    resizeLeft(event);
  }
}
tr.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  ix = event.clientX;
  iy = event.clientY;
  ot = w.offsetTop;
  ow = w.offsetWidth;
  oh = w.offsetHeight;
  this.onpointermove = function(event) {
    resizeTop(event);
    resizeRight(event);
  }
}
bl.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  iy = event.clientY;
  oh = w.offsetHeight;
  ix = event.clientX;
  ol = w.offsetLeft;
  ow = w.offsetWidth;
  this.onpointermove = function(event) {
    resizeBottom(event);
    resizeLeft(event);
  }
}
br.onpointerdown = function(event) {
  this.setPointerCapture(event.pointerId);
  iy = event.clientY;
  oh = w.offsetHeight;
  ix = event.clientX;
  ow = w.offsetWidth;
  this.onpointermove = function(event) {
    resizeBottom(event);
    resizeRight(event);
  }
}

function addTabs(...tabs) {
bd.remove();
var tabbar = document.createElement('div');
tabbar.style = `
  position: absolute;
  top: 22px;
  left: 0px;
  width: 100%;
  height: 22px;
  display: flex;
`;
w.appendChild(tabbar);
var vis = null;
function select(tab,body) {
  vis[0].style.backgroundColor = 'black';
  vis[0].style.color = 'white';
  vis[1].style.visibility = 'hidden';
  tab.style.backgroundColor = 'darkgray';
  tab.style.color = 'black';
  body.style.visibility = 'visible';
  vis = [tab,body];
}
var ret = [];
tabs.forEach((tab,i) => {
  var ta = document.createElement('div');
  ta.style = `
    height: 22px;
    flex-grow: 1;
    text-indent: 6px;
    display: flex;
    align-items: center;
    user-select: none;
    box-sizing: border-box;
    border-bottom: 1px solid black;
  `;
  ta.innerText = tab;
  var tbd = document.createElement('div');
  tbd.style = `
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    height: calc(100% - 44px);
    background-color: lightgrey;
    padding: 10px;
    box-sizing: border-box;
  `;
  if (i) {
    tbd.style.visibility = 'hidden';
    ta.style.backgroundColor = 'black';
    ta.style.color = 'white';
  } else {
    ta.style.backgroundColor = 'darkgray';
    ta.style.color = 'black';
    vis = [ta,tbd];
  }
  w.appendChild(tbd);
  tabbar.appendChild(ta);
  ta.onclick = function(event) {
    select(ta,tbd);
  }
  ret.push([ta,tbd]);
});
  this.tabs = ret;
  return ret;
}

function addText(element,text) {
  var div = document.createElement('div');
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
  `;
  div.innerText = text;
  element.appendChild(div);
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div];
}

function addInput(element, label, type, def, action) {
  var div = document.createElement('div');
  var lab = document.createElement('div');
  var inp = document.createElement('input');
  div.appendChild(lab);
  div.appendChild(inp);
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    justify-content: space-between;
  `;
  lab.style = `
    flex-shrink: 0;
  `;
  inp.style = `
    flex-grow: 1;
    min-width: 0;
    max-width: 50%;
  `;
  lab.innerText = label;
  inp.type = type;

  element.appendChild(div);
  if (type === 'button') {
    inp.value = def;
    inp.onclick = function(event) {
      action();
      rerender = true;
    };
  } else {
    if (type === 'checkbox') {
      inp.checked = def;
    } else {
      inp.value = def;
    }
    inp.oninput = function(event) {
      var value = type === 'checkbox' ? event.target.checked : event.target.value;
      action(value);
      rerender = true;
    };
  }
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div,lab,inp];
}

function addTextAreaInp(element, label, def, action) {
  var div = document.createElement('div');
  var lab = document.createElement('div');
  var inp = document.createElement('textarea');
  div.appendChild(lab);
  div.appendChild(inp);
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    justify-content: space-between;
  `;
  lab.style = `
    flex-shrink: 0;
  `;
  inp.style = `
    flex-grow: 1;
    min-width: 0;
    max-width: 50%;
  `;
  lab.innerText = label;

  element.appendChild(div);

  inp.value = def;
  inp.oninput = function(event) {
    var value = event.target.value;
    action(value);
    rerender = true;
  };
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div,lab,inp];
}

function addDualInput(element, label, type1, type2, def1, def2, action1, action2) {
  var div = document.createElement('div');
  var lab = document.createElement('div');
  var inps = document.createElement('div');
  var inp1 = document.createElement('input');
  var inp2 = document.createElement('input');
  div.appendChild(lab);
  div.appendChild(inps);
  inps.appendChild(inp1);
  inps.appendChild(inp2);
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    justify-content: space-between;
  `;
  lab.style = `
    flex-shrink: 0;
  `;
  inp1.style = inp2.style = `
    min-width: 0;
    max-width: calc(50% - 4px);
  `;
  inps.style = `
    display: flex;
    flex-grow: 1;
    min-width: 0;
    max-width: 50%;
    justify-content: space-between;
  `;
  lab.innerText = label;
  inp1.type = type1;
  inp2.type = type2;

  element.appendChild(div);
  if (type1 === 'button') {
    inp1.value = def1;
    inp1.onclick = function(event) {
      action1();
      rerender = true;
    };
  } else {
    if (type1 === 'checkbox') {
      inp1.checked = def1;
    } else {
      inp1.value = def1;
    }
    inp1.oninput = function(event) {
      var value = type1 === 'checkbox' ? event.target.checked : event.target.value;
      action1(value);
      rerender = true;
    };
  }
  if (type2 === 'button') {
    inp2.value = def2;
    inp2.onclick = function(event) {
      action2();
      rerender = true;
    };
  } else {
    if (type2 === 'checkbox') {
      inp2.checked = def2;
    } else {
      inp2.value = def2;
    }
    inp2.oninput = function(event) {
      var value = type2 === 'checkbox' ? event.target.checked : event.target.value;
      action2(value);
      rerender = true;
    };
  }
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div,lab,inp1,inp2];
}

function addSelect(element, label, options, def, action) {
  var div = document.createElement('div');
  var lab = document.createElement('div');
  var sel = document.createElement('select');
  options.forEach(option => {
    var text,value;
    if (Array.isArray(option)) {
      text = option[0];
      value = option[1];
    } else {
      text = value = option;
    }
    var opt = document.createElement('option');
    opt.setAttribute('value',value);
    opt.innerText = text;
    sel.appendChild(opt);
  });
  div.appendChild(lab);
  div.appendChild(sel);
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    justify-content: space-between;
  `;
  lab.style = `
    flex-shrink: 0;
  `;
  sel.style = `
    flex-grow: 1;
    min-width: 0;
    max-width: 50%;
  `;
  sel.value = def;
  lab.innerText = label;
  element.appendChild(div);
  sel.oninput = function(event) {
    var value = event.target.value;
    action(value);
    rerender = true;
  };
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div,lab,sel];
}

function addDatalist(element, label, options, def, action) {
  var div = document.createElement('div');
  var lab = document.createElement('div');
  var inp = document.createElement('input');
  var dl = document.createElement('datalist');
  var uid = performance.now();
  dl.id = uid;
  inp.setAttribute('list', uid);
  options.forEach(option => {
    var text,value;
    if (Array.isArray(option)) {
      text = option[0];
      value = option[1];
    } else {
      text = value = option;
    }
    var opt = document.createElement('option');
    opt.setAttribute('value',value);
    opt.innerText = text;
    dl.appendChild(opt);
  });
  div.appendChild(lab);
  div.appendChild(inp);
  div.appendChild(dl);
  div.style = `
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    justify-content: space-between;
  `;
  lab.style = `
    flex-shrink: 0;
  `;
  inp.style = `
    flex-grow: 1;
    min-width: 0;
    max-width: 50%;
  `;
  lab.innerText = label;

  element.appendChild(div);
  inp.value = def;
  inp.oninput = function(event) {
    var value = event.target.value;
    action(value);
    rerender = true;
  };
  this.minHeight = max(this.minHeight,div.parentElement.offsetTop+div.offsetTop+div.offsetHeight+40);
  w.style.height = this.minHeight + 'px';
  return [div,lab,inp];
}



function addTextArea(element, def='', action) {
  var div = document.createElement('div');
  var area = document.createElement('textarea');
  div.appendChild(area);
  div.style = `
    display: flex;
    height: calc(100% - 30px);
    width: 100%;
  `;
  area.style = `
    width: 100%;
    height: 100%;
    resize: none;
    outline: none;
    tab-size: 4;
  `;
  area.setAttribute('spellcheck','false');

  area.value = def;

  element.appendChild(div);
  enableTabToIndent(area);
    area.onkeydown = function(event) {
      event.stopPropagation();
    }

    area.oninput = function(event) {
      action(event.target.value);
      rerender = true;
    };
  return [div,area];
}

function addOkCancel(okAction=()=>{},cancelAction=()=>{}) {
var ok = document.createElement('button');
var cancel = document.createElement('button');
ok.innerText = 'OK';
cancel.innerText = 'Cancel';
ok.style = cancel.style = `
  position: absolute;
  width: 71px;
  height: 20px;
  bottom: 10px;
`;
ok.style.right = '10px';
cancel.style.right = '91px';
w.appendChild(ok);
w.appendChild(cancel);
ok.onclick = function(event) {
  okAction();
  w.remove();
}
cancel.onclick = function(event) {
  cancelAction();
  w.remove();
}
return [ok,cancel];

}

function addDelete(deleteAction=()=>{},) {
var del = document.createElement('button');
del.innerText = 'Delete';
del.style = `
  position: absolute;
  width: 71px;
  height: 20px;
  bottom: 10px;
  left: 10px;
`;
w.appendChild(del);
del.onclick = function(event) {
  deleteAction();
}
return del;

}

function close() {
  if (this?.onClose) this.onClose();
  w.remove();
}

this.onClose = () => {}

w.style.height = w.minHeight + 'px';
w.style.width = w.minWidth + 'px';

this.body = bd;
this.element = w;
this.addTabs = addTabs;
this.addText = addText;
this.addInput = addInput;
this.addDualInput = addDualInput;
this.addTextAreaInp = addTextAreaInp;
this.addSelect = addSelect;
this.addDatalist = addDatalist;
this.addOkCancel = addOkCancel;
this.addDelete = addDelete;
this.addTextArea = addTextArea;
this.close = close;

}

  static addLicensePopup() {
    var w = new FloatingWindow2('');
    w.resizable = false;
    w.element.style.left = '0px';
    w.element.style.top = '0px';
    w.element.style.width = window.innerWidth - 2 + 'px';
    w.element.style.height = window.innerHeight - 2 + 'px';
    w.body.innerHTML = `<h2>This Project is Public Domain</h2>
<p>This is free and unencumbered software released into the public domain.</p>
<p>Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.</p>
<p>In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.</p>
<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.</p>
<p>For more information, please refer to <a href=https://unlicense.org/>https://unlicense.org/</a></p>`;
    var dontshow = document.createElement('input');
    dontshow.type = 'checkbox';
    dontshow.id = 'dont-show-again';
    var label = document.createElement('label');
    label.htmlFor = 'dont-show-again';
    label.innerText = "Don't show again";

    var ok = document.createElement('button');
    ok.innerText = 'Okay';
    ok.style.marginLeft = '10px';

    w.body.appendChild(dontshow);
    w.body.appendChild(label);
    w.body.appendChild(ok);
    ok.onclick = () => {
      if (dontshow.checked) localStorage.setItem('skip-popup','true');
      w.element.remove();
    }

  }

  static addCircuitDialogue() {
    var title = 'Circuit Settings';
    var w = new FloatingWindow2(title);
    w.addInput(w.body,'Component Name:','text',circuit.settings.name,value => circuit.settings.name = value);
    w.addInput(w.body,'Component Width:','number',circuit.settings.width,value => circuit.settings.width = value);

    w.addDatalist(w.body,'Shape:',[['Normal','normal'],['Layout','layout'],['DIL Chip','DIL']], circuit.settings.shape, value => circuit.settings.shape = value);


    w.addInput(w.body,'Clock Frequency:','number',circuit.settings.frequency,value => circuit.settings.frequency = value);
  }

  static addSettingsDialogue() {

    var title = 'Settings';
    var w = new FloatingWindow2(title);
    var tbs = w.addTabs('General','Colors');

    w.addSelect(tbs[0][1],'Grid:',[['None','none'],['Dots','dots'],['Lines','lines']],settings.grid, value => setSetting('grid',value));

    w.addInput(tbs[1][1],'Background:','color',settings.bgcolor, value => setSetting('bgcolor',value));
    w.addInput(tbs[1][1],'Grid:','color',settings.gridcolor, value => setSetting('gridcolor',value));
    w.addInput(tbs[1][1],'Component:','color',settings.componentcolor, value => setSetting('componentcolor',value));
    w.addInput(tbs[1][1],'Wire:','color',settings.wirecolor, value => setSetting('wirecolor',value));
    w.addInput(tbs[1][1],'Wire (high):','color',settings.wirehighcolor, value => setSetting('wirehighcolor',value));
    w.addInput(tbs[1][1],'Wire (low):','color',settings.wirelowcolor, value => setSetting('wirelowcolor',value));
    w.addInput(tbs[1][1],'Wire (high-z):','color',settings.wirehighzcolor, value => setSetting('wirehighzcolor',value));
    w.addInput(tbs[1][1],'Input Pin:','color',settings.inputpincolor, value => setSetting('inputpincolor',value));
    w.addInput(tbs[1][1],'Output Pin:','color',settings.outputpincolor, value => setSetting('outputpincolor',value));
    w.addInput(tbs[1][1],'Dual Pin:','color',settings.dualpincolor, value => setSetting('dualpincolor',value));
    w.addInput(tbs[1][1],'Text:','color',settings.textcolor, value => setSetting('textcolor',value));
    w.addInput(tbs[1][1],'Selection:','color',settings.selectioncolor, value => setSetting('selectioncolor',value));


  }

  static addGenericDialogue(component) {
    var title = component.type === 'IC' ? component.subcircuit : component.type;
    var w = new FloatingWindow2(title);
    var tbs = w.addTabs('Functional','Aesthetic','Scripting');
    var attributes = component.attributes;

  w.addTextArea(tbs[2][1], component.script ?? '', value => component.script = value);

  if (attributes.includes('label')) {
    var inp = w.addInput(tbs[0][1],'Label:','text',component.label, value => component.label = value)[2];
    inp.focus();
  }

  w.addDualInput(tbs[1][1],'Position:','number','number',component.x,component.y, value => component.x = value, value => component.y = value);

  w.addSelect(tbs[1][1],'Rotation:',[0,1,2,3],component.rotation, value => component.rotation = value);

  if (attributes.includes('text')) {
    w.addTextAreaInp(tbs[1][1],'Text:',component.text, value => component.text = value);
  }
  if (attributes.includes('font')) {
    w.addInput(tbs[1][1],'Font:','string',component.font, value => component.font = value);
  }

  if (attributes.includes('bits')) {
    w.addInput(tbs[0][1],'Bits:','number',component.bits, value => component.bits = value);
  }
  if (attributes.includes('sbits')) {
    w.addInput(tbs[0][1],'Selection Bits:','number',component.sbits, value => component.sbits = value);
  }
  if (attributes.includes('dbits')) {
    w.addInput(tbs[0][1],'Data Bits:','number',component.dbits, value => component.dbits = value);
  }
  if (attributes.includes('abits')) {
    w.addInput(tbs[0][1],'Address Bits:','number',component.abits, value => component.abits = value);
  }
  if (attributes.includes('chipSelect')) {
    w.addInput(tbs[0][1],'Include Chip Select:','checkbox',component.chipSelect, value => component.chipSelect = value);
  }
  if (attributes.includes('dualRW')) {
    w.addInput(tbs[0][1],'Separate Read/Write:','checkbox',component.dualRW, value => component.dualRW = value);
  }
  if (attributes.includes('dualPort')) {
    w.addInput(tbs[0][1],'Dual Port:','checkbox',component.dualPort, value => component.dualPort = value);
  }
  if (attributes.includes('async')) {
    w.addInput(tbs[0][1],'Asynchronous:','checkbox',component.async, value => component.async = value);
  }

  if (attributes.includes('ports')) {
    w.addInput(tbs[0][1],'Ports:','number',component.ports, value => component.ports = value);
  }
  if (attributes.includes('graphicRAM')) {
    w.addInput(tbs[0][1],'Graphic RAM:','checkbox',component.graphicRAM, value => component.graphicRAM = value);
  }
  if (attributes.includes('inBits')) {
    w.addInput(tbs[0][1],'Input Bits:','number',component.inBits, value => component.inBits = value);
  }
  if (attributes.includes('outBits')) {
    w.addInput(tbs[0][1],'Output Bits:','number',component.outBits, value => component.outBits = value);
  }
  if (attributes.includes('setFromIC')) {
    w.addInput(tbs[0][1],'Set Bits from IC:','checkbox',component.setFromIC, value => component.setFromIC = value);
  }
  var inverted;
  if (attributes.includes('inverted')) {
    if (component.pins.length === 1) {
      if (component.pins[0].type === 'output') {
        w.addInput(tbs[0][1],'Invert output:','checkbox',component.inverted === '[0]', value => component.inverted = value ? '[0]' : '[]');
      } else {
        w.addInput(tbs[0][1],'Invert input:','checkbox',component.inverted === '[0]', value => component.inverted = value ? '[0]' : '[]');
      }
    } else {
      inverted = w.addInput(tbs[0][1],'Inverted:','text',component.inverted, value => component.inverted = value);
    }
  }

  if (attributes.includes('signed')) {
    w.addInput(tbs[0][1],'Signed Operation:','checkbox',component.signed, value => component.signed = value);
  }

  if (attributes.includes('mirror')) {
    w.addInput(tbs[1][1],'Mirror:','checkbox',component.mirror, value => component.mirror = value);
  }
  if (attributes.includes('small')) {
    w.addInput(tbs[1][1],'Small Shape:','checkbox',component.small, value => component.small = value);
  }

  if (attributes.includes('color')) {
    w.addInput(tbs[1][1],'Color:','color',component.color, value => component.color = value);
  }
  if (attributes.includes('offColor')) {
    w.addInput(tbs[1][1],'Off Color:','color',component.offColor, value => component.offColor = value);
  }
  if (attributes.includes('size')) {
    w.addInput(tbs[1][1],'Size:','number',component.size, value => component.size = value);
  }
  if (attributes.includes('square')) {
    w.addInput(tbs[1][1],'Square:','checkbox',component.square, value => component.square = value);
  }
  if (attributes.includes('border')) {
    w.addInput(tbs[1][1],'Border:','checkbox',component.border, value => component.border = value);
  }

  if (attributes.includes('width')) {
    w.addInput(tbs[1][1],'Width:','number',component.width, value => component.width = value);
  }
  if (attributes.includes('height')) {
    w.addInput(tbs[1][1],'Height:','number',component.height, value => component.height = value);
  }
  if (attributes.includes('fontSize')) {
    w.addInput(tbs[1][1],'Font Size:','number',component.fontSize, value => component.fontSize = value);
  }

  if (attributes.includes('hideLabel')) {
    w.addInput(tbs[1][1],'Hide Pin Label:','checkbox',component.hideLabel, value => component.hideLabel = value);
  }

  if (attributes.includes('autoPos')) {
    if (circuit.settings.shape === 'DIL') {
      w.addInput(tbs[1][1],'Pin #:','number',component.pin, value => component.pin = value);
    } else {
    w.addInput(tbs[1][1],'Set Pin Position:','checkbox',!component.autoPos, value => {
      component.autoPos = !value;
      xinp.disabled = !value;
      yinp.disabled = !value;
      oinp.disabled = !value;
    });
    var xinp = w.addInput(tbs[1][1],'Pin X:','number',component.pinx ?? 0, value => component.pinx = value)[2];
    var yinp = w.addInput(tbs[1][1],'Pin Y:','number',component.piny ?? 0, value => component.piny = value)[2];
    var oinp = w.addSelect(tbs[1][1],'Pin Orientation:',[['Left','left'],['Right','right'],['Top','top'],['Bottom','bottom']],component.pino, value => component.pino = value)[2];
    xinp.disabled = component.autoPos;
    yinp.disabled = component.autoPos;
    oinp.disabled = component.autoPos;
    }
  }



  if (attributes.includes('key')) {
    var inp = w.addInput(tbs[0][1],'Map to Key:','text', component.key, value => component.key = value)[2];
    w.addInput(tbs[0][1],'','button', 'Reset', () => {
      inp.value = '';
      component.key = null;
    });
    inp.onkeydown = function(event) {
      event.preventDefault();
      inp.value = event.code;
      component.key = event.code;
    };
    inp.onfocus = function(event) {
      inp.placeholder = '(press any key)';
    }
    inp.onblur = function(event) {
      inp.placeholder = '';
    }
  }

  if (attributes.includes('keys')) {
    var keys = {
      wasd: 'wasd',
      arrows: 'arrows',
      none: null,
    }
    var keysback = new Map();
    keysback.set('wasd','wasd');
    keysback.set('arrows','arrows');
    keysback.set(null,'none');

    w.addSelect(tbs[0][1],'Map to Keys:',['wasd','arrows','none'],keysback.get(component.keys), value => component.keys = keys[value]);
  }
  var inputs;
  if (attributes.includes('inputs')) {
    inputs = w.addInput(tbs[0][1],'# of Inputs:','number',component.inputs, value => component.inputs = value);
    if (component?.multiBit) inputs[2].disabled = true;
  }
  if (attributes.includes('compliment')) {
    w.addInput(tbs[0][1],'Complimentary Outputs:','checkbox',component.compliment, value => {
      component.compliment = value;
      if (inverted) inverted[2].value = component.inverted;
    });
  }
  if (attributes.includes('multiBit')) {
    w.addInput(tbs[0][1],'Bus Input:','checkbox',component.multiBit, value => {
      component.multiBit = value;
      if (inputs) {
        inputs[2].disabled = value;
        inputs[2].value = component.inputs;
      }
    });
  }

  if (attributes.includes('inputType')) {
    w.addSelect(tbs[0][1],'Input Type:',[['Normal',null],['Schmitt Trigger','schmitt']],component.inputType, value => {
      component.inputType = value;
    });
  }

  if (attributes.includes('outputType')) {
    w.addSelect(tbs[0][1],'Output Type:',[['Normal',null],['Open-Drain','od'],['Open-Source','os'],['Open-Collector','oc'],['Open-Emitter','oe']],component.outputType, value => {
      component.outputType = value;
    });
  }

  if (attributes.includes('data')) {
    w.addInput(tbs[0][1],'Data:','text',component.data, value => component.data = value);
  }
  if (attributes.includes('ddram')) {
    function setAsciiInp() {
      var str = component.ddram.map(v => String.fromCharCode(v));
      while(str[str.length-1] === '\x00') str.pop();
      asciiinp.value = str.join('');
    }
    var ddraminp = w.addInput(tbs[0][1],'DDRAM Data:','text',component.ddram, value => {
      component.ddram = value;
      setAsciiInp();
    })[2];
    var asciiinp = w.addInput(tbs[0][1],'DDRAM Data:','text','', value => {
      component.ddram = value.split('').map(ch => ch.charCodeAt());
      ddraminp.value = component.ddram;
    })[2];
    setAsciiInp();
  }
  if (attributes.includes('cgram')) {
    w.addInput(tbs[0][1],'CGRAM Data:','text',component.cgram, value => component.cgram = value);
  }
  if (attributes.includes('value')) {
    w.addInput(tbs[0][1],'Value:','number',component.value, value => component.value = value);
  }
  if (attributes.includes('dual')) {
    w.addInput(tbs[0][1],'Dual Pin:','checkbox',component.dual, value => component.dual = value);
  }

  if (attributes.includes('direction')) {
    w.addSelect(tbs[0][1],'Direction:',[['Auto','auto'],['Forward','forward'],['Backward','backward'],['1 way gate','1way']],component.direction, value => component.direction = value);
  }



  if (attributes.includes('display')) {
    w.addSelect(tbs[0][1],'Display:',[['7 Segment','7seg'],['16 Segment','16seg'],['14 Segment','14seg'],['M/-/E flags','MNEflags']],component.display, value => {
      component.display = value;
      refreshEncoding();
    });
  }
  var encoding, refreshEncoding;
  if (attributes.includes('encoding')) {
    refreshEncoding = function() {
      if (encoding) encoding.remove();
      var display = component.display;
      if (display === '7seg') {
        encoding = w.addSelect(tbs[0][1],'Encoding:',[['None - Seperate Inputs','noneSplit'],['None - Bus Input','noneBus'],['4-Bit BCD','bcd'],['4-Bit BCD w/ tail','bcdTail'],['4-Bit Hex','hex'],['4-Bit Hex w/ tail','hexTail']],component.encoding, value => component.encoding = value)[0];
      } else if (display === '14seg') {
        encoding = w.addSelect(tbs[0][1],'Encoding:',[['None - Bus Input','noneBus'],['4-Bit BCD','bcd'],['4-Bit Hex','hex'],['7-Bit ASCII','ascii']], component.encoding, value => component.encoding = value)[0];
      } else if (display === '16seg') {
        encoding = w.addSelect(tbs[0][1],'Encoding:',[['None - Bus Input','noneBus'],['4-Bit BCD','bcd'],['4-Bit Hex','hex'],['7-Bit ASCII','ascii']], component.encoding, value => component.encoding = value)[0];
      } else if (display === 'MNEflags') {
        encoding = w.addSelect(tbs[0][1],'Encoding:',[['None - Seperate Inputs','noneSplit'],['None - Bus Input','noneBus']],component.encoding, value => component.encoding = value)[0];
      }
    }
    refreshEncoding();
  }

  

  if (attributes.includes('numFormat')) {
    w.addSelect(tbs[0][1],'Number Format:',['dec','bin','hex','signdec'],component.numFormat,value => component.numFormat = value);
  }


  if (attributes.includes('displaySize')) {
    w.addSelect(tbs[0][1],'Display Size:',['1x8','1x16','2x8','2x16','2x20','4x16','4x20'],component.displaySize,value => component.displaySize = value);
  }

  if (attributes.includes('hex')) {
    w.addInput(tbs[0][1],'Encode Hex:','checkbox',component.hex, value => component.hex = value);
  }
  if (attributes.includes('ascii')) {
    w.addInput(tbs[0][1],'Encode ascii:','checkbox',component.ascii, value => component.ascii = value);
  }
  if (attributes.includes('gray')) {
    w.addSelect(tbs[0][1],'Encoding:',['binary','gray'],component.gray ? 'gray' : 'binary', value => component.gray = value === 'gray');
  }
  if (attributes.includes('sticky')) {
    w.addInput(tbs[0][1],'Sticky:','checkbox',component.sticky, value => component.sticky = value);
  }
  if (attributes.includes('dt')) {
    w.addInput(tbs[0][1],'Double Throw:','checkbox',component.dt, value => component.dt = value);
  }
  if (attributes.includes('input splitting')) {
    w.addInput(tbs[0][1],'Input Splitting:','text',component['input splitting'], value => component['input splitting'] = value);
  }
  if (attributes.includes('output splitting')) {
    w.addInput(tbs[0][1],'Output Splitting:','text',component['output splitting'], value => component['output splitting'] = value);
  }
  if (attributes.includes('spreading')) {
    w.addInput(tbs[0][1],'Spreading:','number',component.spreading, value => component.spreading = value);
  }

  if (component.type in builtIn) {
    w.addInput(tbs[0][1],'','button','Open Circuit',() => {
      w.close();
      loadConcrete(builtIn[component.type],component.getParameterBindings());
    })
  }

  if (component.type === 'IC') {

    w.addSelect(tbs[0][1],'Location:',['Blank','Saves','Examples','DIL Library'],component.location, value => {
      component.location = value;
      component.init();
      refreshFields(false);
    });
    var dl = null;
    var parameterInps = [];
    function refreshFields(init) {
      if (dl) dl.remove();
      parameterInps.forEach(inp => inp.remove());
      parameterInps.length = 0;
      dl = w.addDatalist(tbs[0][1],'Circuit:',Object.keys(component.getLocation()),init ? component.subcircuit : '', value => {
        component.subcircuit = value;
        component.init();
        parameterInps.forEach(inp => inp.remove());
        parameterInps.length = 0;
        populateParameters();
      })[0];
      function populateParameters() {
        component.parameters.forEach(parameter => {
          parameterInps.push(w.addInput(tbs[0][1],parameter + ':','text',component[parameter],value => {
            component[parameter] = value;
            component.init();
          })[0]);
        });
        parameterInps.push(w.addInput(tbs[0][1],'','button','Open Circuit',() => {
          w.close();
          if (!running) component.init();
          circuitStack.push(component.circuit);
        })[0]);
      }
      populateParameters();
    }
    refreshFields(true);
  }

    w.addOkCancel(()=>{},()=>{});
  }

}

/*
     var add = w.addInput(tbs[2][1],'Add Parameter:','text','', parameter => {
        if (parameter in parameterInputs) return;
        parameterInputs[parameter] = w.addInput(tbs[2][1],parameter + ':','text','',value => {
          component[parameter] = value;
          component.init();
        });
        add.value = '';
      })[2];
    var parameterInputs = {};
    component.parameters.forEach(parameter => {
      parameterInputs[parameter] = w.addInput(tbs[2][1],parameter + ':','text',component[parameter],value => {
        component[parameter] = value;
        component.init();
      })[2];
    });
*/