"use strict";
var canvas = document.getElementsByTagName('canvas')[0];

var Cell = function(row, col, type, background, primarySelection, secondarySelection) {
    this.row = row || 0;
    this.col = col || 0;
    this.type = type || 0;
    this.background = background || 0;
    this.primarySelection = primarySelection || 0;
    this.secondarySelection = secondarySelection || 0;
}

var Matrix = function(width, height, canvas, autoResize, ctrlZ) {
    this.width = width;
    this.height = height || width;
    this.clear(1);

    this.canvas = canvas || document.getElementsByTagName('canvas')[0];
    this.context = this.canvas.getContext('2d');

    this.fillStyles = {0: 'none', 1: '#33DD33', 2: '#459990', 3: '#CC3333'};
    this.backgrounds = {0: 'none', 1: '#426687'};
    this.selectionStyle = {0: 'none', 1: 'rgb(220, 220, 220)', 2: 'rgba(220, 220, 220, 0.2)'};
    this.borderStyle = '#CCC';

    var self = this;

    if (autoResize === undefined || autoResize) {
        this.resize();
        window.onresize = function() {
            self.resize();
            self.updateDimensions();
            self.render(self.board);
        };
    }

    this.history = [];
    this.future = [];
    if (ctrlZ === undefined || ctrlZ) {
        this.canvas.addEventListener('keydown', function(e) {
            if (e.keyCode === 90 && e.ctrlKey) {
                if (e.shiftKey) {
                    self.redo();
                } else {
                    self.undo();
                }
                self.render();
            }
        });
    }

    this.lastMovement = [null, null];
    this.translateEventListener('onmousemove');
    this.translateEventListener('onmousedown');
    this.translateEventListener('onmouseup');
    this.translateEventListener('onclick');

    this.updateDimensions();
    setTimeout(this.render.bind(this), 1);

    this.debug = {};
};

Matrix.prototype.translateEventListener = function(eventName) {
    var self = this;
    this.canvas[eventName] = function(e) {
        if (self[eventName]) {
            e.col = self.xToCol(e.clientX);
            e.row = self.yToRow(e.clientY);
            e.cell = self.isValid(e.row, e.col) ? self.board[e.row][e.col] : undefined;
            if (eventName == 'onmousemove') {
                if (e.row == self.lastMovement[0] && e.col == self.lastMovement[1]) {
                    return;
                } else {
                    self.lastMovement = [e.row, e.col];
                }
            }
            self[eventName](e);
            self.render();
        }
    };
}

Matrix.prototype.isValid = function(row, col) {
    return row >= 0 && row < this.height && col >= 0 && col < this.height;
};

Matrix.prototype.xToCol = function(x) {
    return Math.round((x - this.canvas.width/2) / this.cellSpace + this.width/2 - 0.5);
};

Matrix.prototype.yToRow = function(y) {
    return Math.round((y - this.canvasPadding) / this.cellSpace - 0.5);
};

Matrix.prototype.resize = function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

Matrix.prototype.updateDimensions = function() {
    this.width = this.board[0].length;
    this.height = this.board.length;

    this.canvasPadding = this.canvas.height / 20;
    this.cellSpace = Math.min((this.canvas.width - 2*this.canvasPadding) / this.width, (this.canvas.height - 2*this.canvasPadding) / this.height);
    if (this.cellSpace > 10) {
        this.cellPadding = Math.max(1, this.cellSpace / 20);
    } else {
        this.cellPadding = 0;
    }
    this.cellBorder = this.cellSpace / 5;
    this.cellSize = this.cellSpace - this.cellPadding * 2;
};

Matrix.prototype.render = function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.save();
    for (var col = 0; col < this.width; col++) {
        var x = this.canvas.width/2 + (col-this.width/2)*this.cellSpace;

        for (var row = 0; row < this.height; row++) {
            var y = this.canvasPadding + row * this.cellSpace;

            var cell = this.board[row][col];

            if (cell.background !== 0) {
                var fillStyle = this.backgrounds[cell.background];
                this.context.fillStyle = fillStyle;
                this.context.fillRect(x, y - this.cellPadding,
                                 this.cellSpace, this.cellSpace);
            }

            if (cell.type !== 0) {
                var fillStyle = this.fillStyles[cell.type];
                
                this.context.fillStyle = fillStyle;
                this.context.fillRect(x + this.cellPadding, y,
                                 this.cellSize, this.cellSize);
                if (this.cellSpace > 10) {
                    this.context.strokeStyle = this.borderStyle;
                    this.context.strokeRect(x + this.cellPadding, y,
                                       this.cellSize, this.cellSize);
                }
            }

            if (cell.primarySelection) {
                this.context.fillStyle = this.selectionStyle[cell.primarySelection];
                this.context.beginPath();
                this.context.moveTo(x+this.cellBorder+this.cellPadding, y+this.cellBorder);
                this.context.lineTo(x+this.cellSize-this.cellBorder+this.cellPadding, y+this.cellBorder);
                this.context.lineTo(x+this.cellBorder+this.cellPadding, y+this.cellSize-this.cellBorder);
                this.context.fill();
            }
            if (cell.secondarySelection) {
                this.context.fillStyle = this.selectionStyle[cell.secondarySelection];
                this.context.beginPath();
                this.context.moveTo(x+this.cellPadding+this.cellSize-this.cellBorder, y+this.cellSize-this.cellBorder);
                this.context.lineTo(x+this.cellPadding+this.cellSize-this.cellBorder, y+this.cellBorder);
                this.context.lineTo(x+this.cellPadding+this.cellBorder, y+this.cellSize-this.cellBorder);
                this.context.fill();
            }
        }
    }
    this.context.restore();

    this.context.save();
    this.context.fillStyle = '#CCC';
    this.context.font = '16px Verdana';
    this.context.textAlign = 'right';
    var yStart = 20;
    var xStart = this.canvas.width - 10;
    for (var prop in this.debug) {
        this.context.fillText(prop + ": " + this.debug[prop], xStart, yStart);
        yStart += 20;
    }
    this.context.restore();
};

Matrix.prototype.forEach = function(fn) {
    for (var row = 0; row < this.height; row++) {
        for (var col = 0; col < this.width; col++) {
            fn(this.board[row][col]);
        }
    }
};

Matrix.prototype.clear = function(defaultType) {
    this.board = [];
    defaultType = defaultType === undefined ? 0 : defaultType;
    for (var row = 0; row < this.height; row++) {
        var line = [];
        this.board.push(line);
        for (var col = 0; col < this.width; col++) {
            line.push(new Cell(row, col, defaultType));
        }
    }
};

Matrix.prototype.clearSelection = function() {
    this.forEach(function(cell) {
        cell.primarySelection = 0;
        cell.secondarySelection = 0;
    });
};

Matrix.prototype.save = function() {
    var backup = [];
    for (var row = 0; row < this.height; row++) {
        var line = [];
        backup.push(line);
        for (var col = 0; col < this.width; col++) {
            var backupCell = new Cell();
            var cell = this.board[row][col];
            for (var prop in cell) {
                backupCell[prop] = cell[prop];
            }
            line.push(backupCell);
        }
    }

    this.history.push(backup);
    this.future = [];
};

Matrix.prototype.undo = function() {
    if (this.history.length) {
        this.future.push(this.board);
        this.board = this.history.pop();
    } else {
        throw "No more history available for undo.";
    }
};

Matrix.prototype.redo = function() {
    if (this.future.length) {
        this.history.push(this.board);
        this.board = this.future.pop();
    } else {
        throw "No more history available for redo.";
    }    
};