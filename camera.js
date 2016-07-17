// initialize websocket connection
var connection = null;

// audio context
var bufferSize = 256;
var audioContext = new (window.AudioContext || window.webkitAudioContext)();

var scale = 2 ;
var arrayBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate/scale);
var micGain = null ;
var recorder ;


var soundBuffer = [] ;
var playing = false ;

var playSound = function() {
  if (playing) return ;

  var buf = soundBuffer.shift();

  if (!buf) return ;
  
  var audioFrame = convertInt16ToFloat32(buf.split(','));
  
  var channelData = arrayBuffer.getChannelData(0);
  
  for (var i=0; i<audioFrame.length; i++) {
    channelData[i] = audioFrame[i];
  }

  var source = audioContext.createBufferSource();
  source.buffer = arrayBuffer;
  
  //recorder.disonnect(0);//audioContext.destination);

  source.connect(audioContext.destination);
  //if (micGain) {
    //micGain.gain.value = 0;
  //}
  source.onended = function(){
    playing = false;
    playSound() ;
  };
  playing = true;
  source.start();
  playing = false;
}

function convertFloat32ToInt16(buffer) {
  l = buffer.length;
  buf = new Int16Array(l/scale);
  var k=0;
  for (var i=0; i<l; i+=scale) {
    buf[k] = buffer[i] * 512;
    k++;
  }

  return buf;
}

function convertInt16ToFloat32(buffer) {
  l = buffer.length;
  buf = new Float32Array(l);
  while (l--) {
    buf[l] = parseFloat(buffer[l]) / 8192.0 ;
  }
  return buf;
}

function recorderProcess(e) {
  var left = e.inputBuffer.getChannelData(0);
  
  var data = {
    audio: convertFloat32ToInt16(left).join(',')
  };

  connection.send(JSON.stringify(data));

  $('#data-audio-size').text(data.audio.length);
}

function initializeRecorder(stream) {
  video.src = window.URL.createObjectURL(stream);
  video.muted = true ;
  video.play();

  var audioInput = audioContext.createMediaStreamSource(stream);
  micGain = audioContext.createGain();
  //micGain.gain.value = 0.5;
  
  // create a javascript node
  recorder = audioContext.createScriptProcessor(bufferSize, 1, 1);
  
  // specify the processing function
  recorder.onaudioprocess = recorderProcess;
  
  // connect stream to our recorder
  audioInput.connect(micGain);
  micGain.connect(recorder);
  recorder.connect(audioContext.destination);
}

function onError(err) {
  console.log(err);
}

// Put event listeners into place
window.addEventListener("DOMContentLoaded", function() {
  
  // Grab elements, create settings, etc.
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  var video = document.getElementById("video");

  var videoObj = {
    "video": true
  };

  var errBack = function(error) {
    console.log("Video capture error: ", error.code); 
  };

  // Put video listeners into place
  if(navigator.getUserMedia) { // Standard
    navigator.getUserMedia(videoObj, function(stream) {
      video.src = stream;
      video.play();
    }, errBack);
  } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
    var session = {
      audio: true,
      video: true
    };
    navigator.webkitGetUserMedia(session, initializeRecorder, onError);
  }
  else if(navigator.mozGetUserMedia) { // Firefox-prefixed
    navigator.mozGetUserMedia(videoObj, function(stream){
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  }

  var captureImageLoop = function() {
    canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);

    var imageData = canvas.toDataURL('image/jpeg', 0.5);
    var noprefix = imageData.replace("data:image/jpeg;base64,", "");
    var unbased = atob(noprefix);

    var currentValue = parseInt(0 + $('#data-size').text()) ;

    $('#data-video-size').text((unbased.length + currentValue)/2);

    connection.send(JSON.stringify({video: unbased}));

    setTimeout(captureImageLoop, 66);
  }
  var initializeConnection = function() {
      connection = new WebSocket(webSocketServer);
      connection.onopen = connectionOpen;
      connection.onmessage = connectionRecieveMessage;
  };

  var connectionRecieveMessage = function(message) {
    var messageData = JSON.parse(message.data);

    if (messageData.video !== undefined) {
      if (messageData.video.length > 0) {
        var $output = $("#output");
        var videoMessage = $("#video-" + messageData.id);
        if (videoMessage.length === 0) {
          var $img = $('<img width="960" height="720"></img>');
          $img.attr('id', "video-" + messageData.id);
          $output.append($img);
        } 
        $("#video-" + messageData.id).attr('src', "data:image/jpeg;base64," + btoa(messageData.video));
      } else {
        $("#video-" + messageData.id).remove();
      }
    } else if (messageData.audio !== undefined) {

      soundBuffer.push(messageData.audio);
      playSound();
       
    }
  }

  var connectionOpen = function() {
    console.log("Connection with server established");
    captureImageLoop();
  }

  initializeConnection();

}, false);
