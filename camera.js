// initialize websocket connection
var connection = null;

var playAudioContext = new (window.AudioContext || window.webkitAudioContext)();

function convertFloat32ToInt16(buffer) {
  l = buffer.length;
  buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l])*0x7FFF;
  }
  return buf;
}

function convertInt16ToFloat32(buffer) {
  l = buffer.length;
  buf = new Float32Array(l);
  while (l--) {
    buf[l] = parseFloat(buffer[l]) / 0x7FFF;
  }
  return buf;
}

function recorderProcess(e) {
  var left = e.inputBuffer.getChannelData(0);
  var buf = convertFloat32ToInt16(left);
  var text = buf.join(',');
  var data = JSON.stringify({audio: text});
  connection.send(data);
}

function initializeRecorder(stream) {
  var audioContext = window.AudioContext || window.webkitAudioContext ;
  var context = new audioContext();
  var audioInput = context.createMediaStreamSource(stream);
  var bufferSize = 2048;
  // create a javascript node
  var recorder = context.createScriptProcessor(bufferSize, 1, 1);
  // specify the processing function
  recorder.onaudioprocess = recorderProcess;
  // connect stream to our recorder
  audioInput.connect(recorder);
  // connect our recorder to the previous destination
  recorder.connect(context.destination);
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

	//canvas.getContext("2d").translate(160, 0);
	//canvas.getContext("2d").scale(-1, 1);

	// Put video listeners into place
	if(navigator.getUserMedia) { // Standard
		navigator.getUserMedia(videoObj, function(stream) {
			video.src = stream;
			video.play();
		}, errBack);
	} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
		navigator.webkitGetUserMedia(videoObj, function(stream){
			video.src = window.URL.createObjectURL(stream);
		}, errBack);

		var session = {
		  audio: true,
		  video: false
		};
		var recordRTC = null;
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

		$('#data-size').text((unbased.length + currentValue)/2);

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
  	console.log("Message id:" + messageData.id);

  	var $output = $("#output");

  	var videoMessage = $("#video-" + messageData.id);
  	if (videoMessage.length === 0) {
	    var $img = $('<img width="960" height="720"></img>');
	    $img.attr('id', "video-" + messageData.id);
  	  $output.append($img);
		} 

		if (messageData.video) {
			if (messageData.video.length > 0) {
				$("#video-" + messageData.id).attr('src', "data:image/jpeg;base64, " + btoa(messageData.video));
			} else {
				$("#video-" + messageData.id).remove();
			}
		} else if (messageData.audio) {
			var buf = messageData.audio.split(',');
			var audioFrame = convertInt16ToFloat32(buf);

		  var bufferSize = 2048;
		  // create a javascript node
		  //var recorder = playAudioContext.createScriptProcessor(bufferSize, 0, 1);
			var arrayBuffer = playAudioContext.createBuffer(1, 2048, playAudioContext.sampleRate);
			var channelData = arrayBuffer.getChannelData(0);
			for (var i=0; i<audioFrame.length; i++) {
				channelData[i] = audioFrame[i];
			}

		  // Get an AudioBufferSourceNode.
		  // This is the AudioNode to use when we want to play an AudioBuffer

		  // set the buffer in the AudioBufferSourceNode
			var source = playAudioContext.createBufferSource();
		  if (!source.buffer)
		  {
		  	source.buffer = arrayBuffer;

			  // connect the AudioBufferSourceNode to the
			  // destination so we can hear the sound
			  source.connect(playAudioContext.destination);

			  // start the source playing
			  source.start();
			}
  	}
  }

  var connectionOpen = function() {
  	console.log("Connection with server established");
  	captureImageLoop();
  }

  initializeConnection();

}, false);
