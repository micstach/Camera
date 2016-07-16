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

	var captureImageLoop = function() {
		canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);

		var imageData = canvas.toDataURL('image/jpeg', 0.25);
		var noprefix = imageData.replace("data:image/jpeg;base64,", "");
		var unbased = atob(noprefix);

		var currentValue = parseInt(0 + $('#data-size').text()) ;

		$('#data-size').text((unbased.length + currentValue)/2);

    connection.send(unbased);

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

		if (messageData.data.length > 0) {

			$("#video-" + messageData.id).attr('src', "data:image/jpeg;base64, " + btoa(messageData.data));
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
