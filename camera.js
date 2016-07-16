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
		canvas.getContext("2d").drawImage(video, 0, 0, 160, 120);

		var imageData = canvas.toDataURL();
		var noprefix = imageData.replace("data:image/png;base64,", "");
		var unbased = atob(noprefix);

    connection.send(unbased);

		setTimeout(captureImageLoop, 1000);
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
	    var $img = $('<img width="320" height="240"></img>');
	    $img.attr('id', "video-" + messageData.id);
  	  $output.append($img);
		} 

		if (messageData.data.length > 0) {
			$("#video-" + messageData.id).attr('src', "data:image/png;base64, " + btoa(messageData.data));
		} else {
			$("#video-" + messageData.id).remove();
		}
  }

  var connectionOpen = function() {
  	console.log("Connection with server established");
  	captureImageLoop();
  }

  initializeConnection();

}, false);
