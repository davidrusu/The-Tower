var sqrt = Math.sqrt;

var Vec = function(x, y) {
  this.x = x;
  this.y = y;
  
  this.set = function(v) {
    this.x = v.x;
    this.y = v.y;
  };
  
  this.update = function() {
    var damp = 0.9;
    this.x *= damp;
    this.y *= damp;
  };
  
  this.dist = function() {
    return sqrt(this.x * this.x + this.y * this.y);
  };
  
  
  this.norm = function() {
    var d = this.dist();
    return new Vec(this.x / d, this.y / d);
  };
  
  this.addv = function(vec) {
    this.x += vec.x;
    this.y += vec.y;
  };
  
  this.add = function(x, y) {
    this.x += x;
    this.y += y;
  };
  
  this.addScaledv = function(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
  };
  
  this.addScaled = function(x, y, s) {
    this.x += x * s;
    this.y += y * s;
  };
  
  this.scale = function(s) {
    this.x *= s;
    this.y *= s;
  };
};

var seeField = false;
var seeParticles = true;

var sqrt2 = sqrt(2);

var gridW = 50;
var gridH = 50;
var grid = [];
var buffer = [];
var cellW;
var cellH;
var nParticles = 700;
var particles = [];
var vels = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  cellW = width / gridW;
  cellH = height / gridH;

  reset('tower');
  
  noSmooth();
}

function reset(version) {
  for (var i = 0; i < nParticles; i++) {
    if (version === 'random') {
      particles[i] = new Vec(random(width), random(height));
    } else if (version === 'tower') {
      var size = 5;
      var w = 10;
      particles[i] = new Vec(width / 2 - size * (w / 2) + (i % w) * size,
                             height / 2 - size * (nParticles / 2) / w + ((i / w) | 0) * size);
    }
    vels[i] = new Vec(0, 0);
  }
  
  for (var x = 0; x < gridW; x++) {
    grid[x] = [];
    buffer[x] = [];
    for (var y = 0; y < gridH; y++) {
      var vx = random(-1,1);
      var vy = random(-1,1);
      grid[x][y] = new Vec(vx, vy);
      buffer[x][y] = new Vec(vx, vy);
    }
  }
}

function mouseDragged() {
  var mx = (mouseX / cellW) | 0;
  var my = (mouseY / cellH) | 0;
  var s = 10;
  for (var x = 0; x < gridW; x++) {
    for (var y = 0; y < gridH; y++) {
      var dx = mouseX - x * cellW;
      var dy = mouseY - y * cellH;
      var d = max(0.1, sqrt(dx * dx + dy * dy));
      grid[x][y].add(dx/d * s/d, dy/d * s/d);
    }
  }
}

function update() {
  updateGrid();
  updateParticles();
}

function updateParticles() {
  for (var i = 0; i < nParticles; i++) {
    var p = particles[i];
    var v = vels[i];
    var x = min(gridW - 1, max(0, ((p.x + cellW / 2) / cellW) | 0));
    var y = min(gridH - 1, max(0, ((p.y + cellH / 2) / cellH) | 0));
    var transferRate = 0.1;
    var origX = v.x;
    var origY = v.y;
    v.addScaledv(grid[x][y], transferRate);
    grid[x][y].addScaled(origX, origY, 0.01);
    v.scale(0.95);
    
    if (p.x < 0) {
      p.x = 0;
      v.x *= -1;
    }
    
    if (p.x > width) {
      p.x = width;
      v.x *= -1;
    }
    
    if (p.y < 0) {
      p.y = 0;
      v.y *= -1;
    }
    
    if (p.y > height) {
      p.y = height;
      v.y *= -1;
    }
    
    p.addv(v);
  }
}

function updateGrid() {
  var propRate = 0.01;
  for (var x = 0; x < gridW; x++) {
    for (var y = 0; y < gridH; y++) {
      var v = buffer[x][y];
      v.set(grid[x][y]);
      if (x < gridW - 1) {
        v.addScaledv(grid[x+1][y], propRate);
        if (y < gridH - 1) {
          v.addScaledv(grid[x+1][y+1], propRate / sqrt2);
        }
        if (y > 0) {
          v.addScaledv(grid[x+1][y-1], propRate / sqrt2);
        }
      }
      if (x > 0) {
        v.addScaledv(grid[x-1][y], propRate);
        if (y < gridH - 1) {
          v.addScaledv(grid[x-1][y+1], propRate / sqrt2);
        }
        if (y > 0) {
          v.addScaledv(grid[x-1][y-1], propRate / sqrt2);
        }
      }
      if (y < gridH - 1) {
        v.addScaledv(grid[x][y+1], propRate);
      }
      if (y > 0) {
        v.addScaledv(grid[x][y-1], propRate);
      }
      
      var pressure = 1;
      if (x === 0 || x === gridW-1 || y === 0 || y === gridH-1) {
        v.scale(pressure);
      }
      var realD = max(0.0001, v.dist());
      var d = min(1, realD);
      v.scale(d/realD);
    }
  }
  
  var temp = grid;
  grid = buffer;
  buffer = grid;
}

function draw() {
  update();
  background(43,43,43);

  if (seeField) {
    drawField();
  }

  if (seeParticles) {
    drawParticles();
  }

  fill(0, 200);
  rect(0, 0, 210, 140);
  fill(255);
  text("fps: " + frameRate().toFixed(1), 10, 25);
  text("(p) Toggle particles: " + (seeParticles ? 'enabled' : 'disabled'), 10, 50);
  text("(f) Toggle vector field: " + (seeField ? 'enabled' : 'disabled'), 10, 70);
  text("(r) reset random", 10, 90);
  text("(t) reset tower", 10, 110);
  text("Drag the mouse to affect the field", 10, 130);
}

function drawParticles() {
  noStroke();
  fill(230,50,75);
  
  var w = 4;
  for (var i = 0; i < nParticles; i++) {
    var p = particles[i];
    rect(p.x, p.y, w, w);
  }
}

function drawField() {
  var scale = sqrt(cellW * cellW + cellH*cellH) / 2;
  var points = (sqrt(cellW * cellW + cellH*cellH)) | 0;

  stroke(242,227,198);
  
  for (var x=0; x < gridW; x += 1) {
    for (var y = 0; y < gridH; y += 1) {
      var vec = grid[x][y];
      line(x * cellW, y * cellH, scale * vec.x + x * cellW, scale * vec.y + y * cellH);
    }
  }
}

function keyPressed() {
  if (key === 'F') {
    seeField = !seeField;
  }
  if (key === 'P') {
    seeParticles = !seeParticles;
  }
  if (key === 'R') {
    reset("random");
  }
  if (key === 'T') {
    reset("tower");
  }
}
