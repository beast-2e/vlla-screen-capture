let ws = null;
let streaming = false;

let status = "";
let host = "";
let fps = 0;

let captureLoopTimeout = 0;

const VLLA_WIDTH = 60;
const VLLA_HEIGHT = 32;

vllaFrame = new Uint8Array(60 * 32 * 3);

videoElement = document.createElement("video");
videoElement.autoplay = true;
document.body.appendChild(videoElement);

canvasElement = document.createElement("canvas");
canvasElement.width = VLLA_WIDTH;
canvasElement.height = VLLA_HEIGHT;
document.body.appendChild(canvasElement);
canvasContext = canvasElement.getContext("2d");

function sendStatusToPopup(){
  chrome.runtime.sendMessage({status});
  console.log(status);
}

function setStatus(message){
  if(status != message){
    status = message;
    sendStatusToPopup();
  }
}

function startScreenCapture(){
  chrome.storage.local.get(function(storage){
    host = storage.host||""
    fps = Math.max(0,parseInt(storage.fps||""))||30;
    if(streaming&&streaming.active){
      setStatus("Stream already active. Restarting websockets.");
      startWebsockets();
    }
    else {
      setStatus("Starting screen capture...")
      chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], null, function(streamID){
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory:{
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: streamID
            },
          }
        }).then(function(screenStream) {
          setStatus("Screen capture started")
          console.log(screenStream)
          window.ss = screenStream;

          streaming = screenStream;
          videoElement.srcObject = screenStream;

          startWebsockets();
          captureLoop();

          screenStream.oninactive = function() {
            setStatus("Screen capture ended");
            stopWebsockets();
          };
        }).catch(function(err) {
          setStatus("Screen capture error: " + err);
        });
      });
    }
  });
}

function startWebsockets(){
  stopWebsockets();
  if(!host){
    setStatus("No host specified.")
    ws = null;
  }
  else{

    setStatus("Connecting to "+host+"...")
    ws = new WebSocket('ws://'+host);

    ws.onopen = function(){
      setStatus("Connected to "+host+".")
    };

    ws.onclose = function(){
      setStatus("Disconnected from "+host+".")
    };
  }
}

function stopWebsockets(){
  if(ws&&ws.readyState == ws.OPEN){
    ws.close();
  }
}

function captureLoop(){
  clearTimeout(captureLoopTimeout);
  if(streaming && streaming.active){
    // console.log("captureloop");
    if(ws && ws.readyState == ws.OPEN){
      // console.log("in business")
      canvasContext.drawImage(videoElement, 0, 0, VLLA_WIDTH, VLLA_HEIGHT);
      let canvasData = canvasContext.getImageData(0, 0, VLLA_WIDTH, VLLA_HEIGHT).data;
      for (let i = 0; i < vllaFrame.length; i++) {
        vllaFrame[i] = canvasData[4 * Math.floor(i / 3) + i % 3];
      }
      ws.send(vllaFrame);
    }
    captureLoopTimeout = setTimeout(captureLoop, 1000/fps);
  }
}

function setHostAndStart(host,fps){
  chrome.storage.local.set({host,fps}, function() {
    if(!host){
      setStatus("Please enter a host to connect to")
    }
    else{
      startScreenCapture()
    }
  });
}

function setBrightness(brightness){
  if(ws && ws.readyState == ws.OPEN){
    ws.send(JSON.stringify({brightness}))
  }
  else{
    setStatus("Please start before setting brightness.")
  }
}

chrome.runtime.onMessage.addListener(function(message, sender, reply) {
  // Listen for a video end event

  if (message.requestStatus) {
    sendStatusToPopup()
  }
  if (message.setBrightness) {
    setBrightness(message.setBrightness.brightness)
  }
  if (message.setHostAndStart) {
    setHostAndStart(
      message.setHostAndStart.host,
      message.setHostAndStart.fps
    )
  }
});
