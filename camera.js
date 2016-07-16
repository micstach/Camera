// initialize websocket connection
var connection = null;

// Put event listeners into place
window.addEventListener("DOMContentLoaded", function() {
	
	// Grab elements, create settings, etc.
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		video = document.getElementById("video"),
		videoObj = { "video": true },
		errBack = function(error) {
			console.log("Video capture error: ", error.code); 
		};

	canvas.getContext("2d").translate(320, 0);
	canvas.getContext("2d").scale(-1, 1);

	// Put video listeners into place
	if(navigator.getUserMedia) { // Standard
		navigator.getUserMedia(videoObj, function(stream) {
			video.src = stream;
			video.play();
		}, errBack);
	} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
		navigator.webkitGetUserMedia(videoObj, function(stream){
			video.src = window.webkitURL.createObjectURL(stream);
			video.play();
		}, errBack);
	}
	else if(navigator.mozGetUserMedia) { // Firefox-prefixed
		navigator.mozGetUserMedia(videoObj, function(stream){
			video.src = window.URL.createObjectURL(stream);
			video.play();
		}, errBack);
	}

	function ab2str(buf) {
	  return String.fromCharCode.apply(null, new Uint16Array(buf));
	}

	function str2ab(str) {
	  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	  var bufView = new Uint16Array(buf);
	  for (var i=0, strLen=str.length; i<strLen; i++) {
	    bufView[i] = str.charCodeAt(i);
	  }
	  return buf;
	}

	var captureImageLoop = function() {
		canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);

		var imageData = canvas.toDataURL();

    connection.send(imageData);

		setTimeout(captureImageLoop, 5000);
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
	    var $img = $('<img></img>');
	    $img.attr('id', "video-" + messageData.id);
  	  $output.append($img);
		} 

		$("#video-" + messageData.id).attr('src', messageData.data);
		
  }

  var connectionOpen = function() {
  	console.log("Connection with server established");
  	captureImageLoop();
  }

  initializeConnection();

}, false);
