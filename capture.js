var vllaWidth = 60;
var vllaHeight = 32;
var captureFPS = 30;
var streaming = false;

var videoElement;
var canvasElement;
var canvasContext;
var needsInit = true;

function init() {
  if (needsInit){
    videoElement = document.createElement("video");
    document.body.appendChild(videoElement);

    canvasElement = document.createElement("canvas");
    canvasElement.width = vllaWidth;
    canvasElement.height = vllaHeight;
    document.body.appendChild(canvasElement);
    canvasContext = canvasElement.getContext("2d");
    needsInit = false;
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if(streaming === false){
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], null, function(streamID){
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamID
          }
        }
      }).then(function(screenStream) {
        init();
        connectVlla();
        window.ss = screenStream;
        // console.log("Stream started");
        streaming = screenStream;
        // console.log(URL.createObjectURL(screenStream));
        videoElement.src = URL.createObjectURL(screenStream);
        captureFrames();
        screenStream.oninactive = function() {
          // console.log("Stream ended.");
          streaming = false;
        };
      }).catch(function(err) {
        // console.log("Stream Error: " + err);
        // alert("Stream Error: " + err);
        streaming = false;
      });
    });
  }
});

function captureFrames(){
  if(!streaming || !streaming.active) {
    streaming = false;
    // console.log("Stream ended unexpectedly.");
    return;
  }
  // console.log("going");
  canvasContext.drawImage(videoElement, 0, 0, vllaWidth, vllaHeight);
  updateVlla(canvasContext.getImageData(0, 0, vllaWidth, vllaHeight).data);
  setTimeout(captureFrames, 1000/captureFPS);
}
