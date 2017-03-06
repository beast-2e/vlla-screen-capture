var ws;

function connectVlla(){
  if(!ws || ws.readyState == ws.CLOSED){
    ws = new WebSocket('ws://evil.mit.edu:8080', 'vlla');
  }
}

function updateVlla(pixels) {
  if (ws && ws.readyState == ws.OPEN) {
    ws.send(encodeVlla(pixels));
  }
}

function encodeVlla(pixels) {
  this.frame = this.frame || new Uint8Array(60 * 32);
  for (var i = 0; i < this.frame.length; i++) {
    this.frame[i] = (
      (Math.floor(pixels[4 * i] / 32) << 5) + // Red - 3 bits
      (Math.floor(pixels[4 * i + 1] / 32) << 2) + // Green - 3 bits
      (Math.floor(pixels[4 * i + 2] / 64)) // Blue - 2 bits
    );
  }
  return this.frame;
}