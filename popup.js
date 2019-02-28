$status = document.getElementById("status");
$host = document.getElementById("host");
$fps = document.getElementById("fps");
$start = document.getElementById("start");
$stop = document.getElementById("stop");
$brightness = document.getElementById("brightness");

chrome.runtime.onMessage.addListener(function(message, sender, reply) {
  console.log(message)
  if (message.status) {
    $status.innerText = message.status;
  }
});

chrome.storage.local.get(function(storage){
  $host.value = storage.host||"";
  $fps.value = storage.fps||"30";
})

$start.addEventListener("click",function(){
  chrome.runtime.sendMessage({
    setHostAndStart:{
      host:$host.value,
      fps:$fps.value
    }
  });
})

$brightness.addEventListener("input",function(){
  chrome.runtime.sendMessage({
    setBrightness:{
      brightness:$brightness.value
    }
  });
})

chrome.runtime.sendMessage({requestStatus:true});