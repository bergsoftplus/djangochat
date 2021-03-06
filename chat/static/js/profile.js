var video;
var canvas;
var localMediaStream = null;
var snapshot = false;
var isStopped = true;
var photoRegex = /^\S*\/photo\/\w{8}_.*$/;
var photoImg;
var userProfileData;
var themeSelector;
var changeProfileForm;
var notificationInput;
var logsInput;

function initChangeProfile() {
	photoImg = $('photoImg');
	video = $('changeProfileVideo');
	canvas = $('canvasBuffer');
	userProfileData = $('userProfileData');
	themeSelector = $('themeSelector');
	changeProfileForm = $('changeProfileForm');
	notificationInput = $('id_notifications');
	logsInput = $('id_logs');
	var item = localStorage.getItem('theme');
	video.addEventListener('click', takeSnapshot, false);
	if (item != null) {
		themeSelector.value = item;
		/*TODO $* to var*/
	}
	if (isDateMissing()) {
		console.warn(getDebugMessage("Browser doesn't support html5 input type date, trying to load javascript datepicker"));
		doGet(PICKADAY_CSS_URL);
		doGet(MOMENT_JS_URL, function () {
			// load pikaday only after moment.js
			doGet(PICKADAY_JS_URL, function () {
				var picker = new Pikaday({
					field: $('id_birthday'),
					format: 'YYYY-MM-DD', // DATE_INPUT_FORMATS_JS
					firstDay: 1,
					maxDate: new Date(),
					yearRange: [1930, 2010]
				});
				console.log(getDebugMessage("pikaday date picker has been loaded"));
			});
		})
	}
	if (!navigator.getUserMedia) {
		console.warn(getDebugMessage('Browser doesnt support capturing video, skipping photo snapshot'));
	}
	CssUtils.hideElement(video);
}


function startSharingVideo() {
	var constraints = {video: true};

	function successCallback(localMediaStream) {
		window.stream = localMediaStream; // stream available to console
		video.src = window.URL.createObjectURL(localMediaStream);
		video.play();
	}

	function errorCallback(error) {
		console.log(getDebugMessage("navigator.getUserMedia error: {}", error));
	}

	navigator.getUserMedia(constraints, successCallback, errorCallback);
}


function takeSnapshot() {
	if (localMediaStream) {
		var ctx = canvas.getContext('2d');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0);
		// "image/webp" works in Chrome.
		// Other browsers will fall back to image/png.
		photoImg.src = canvas.toDataURL('image/webp');
		snapshot = true;
		growlInfo('Image has been set. Click on "Finish" to hide video');
	}
}


function startCapturingVideo(button) {
	if (isStopped) {
		// Not showing vendor prefixes or code that works cross-browser.
		navigator.getUserMedia({video: true}, function (stream) {
			video.src = window.URL.createObjectURL(stream);
			localMediaStream = stream;
			CssUtils.showElement(video);
			photoImg.addEventListener('click', takeSnapshot, false);
			photoImg.style.cursor = 'pointer';
			button.value = 'Finish';
			isStopped = false;
			growlInfo("Click on your video to take a photo")
		}, function (e) {
			console.error(getDebugMessage('Error while trying to capture a picture "{}"', e.message || e.name));
			growlError('Unable to use your webcam because "{}"'.format(e.message || e.name ));
		});
	} else if (!isStopped) {
		if (localMediaStream.stop) {
			localMediaStream.stop();
		} else {
			 localMediaStream.getVideoTracks()[0].stop();
		}
		photoImg.removeEventListener('click', takeSnapshot);
		photoImg.style.cursor = '';
		button.value = 'Renew the photo';
		growlInfo("To apply photo click on save");
		CssUtils.hideElement(video);

		CssUtils.showElement(userProfileData);
		isStopped = true;
	}
}


function setJsState() {
	var options = [];
	localStorage.setItem('theme', themeSelector.value);
	document.body.className = themeSelector.value;
	notifications = notificationInput.checked; // global var
	window.LOGS = logsInput.checked; // global var
	enableLogs();
}

function saveProfile(event) {
	event.preventDefault();
	var image = null;
	var params = null;
	if (snapshot) {
		image = canvas.toDataURL("image/png");
		params = {base64_image: image};
	}
	ajaxShow();
	doPost('/profile', params, function (response) {
		if (response.match(photoRegex)) {
			photoImg.onload = ajaxHide;
			photoImg.onerror = ajaxHide;
			if (typeof photoImg.onload !== 'function' || typeof photoImg.onerror !== 'function' ) {
				ajaxHide();
			}
			photoImg.src = response;
			snapshot = false;
			response = RESPONSE_SUCCESS;
		} else {
			ajaxHide();
		}
		if (response === RESPONSE_SUCCESS) {
			growlSuccess("Your profile has been successfully updated. Press home icon to return on main page");
			setJsState();
		} else {
			growlError(response);
		}
	}, changeProfileForm, true);
}


/** Checks whether browser supports html5 input type date */
function isDateMissing() {
	var input = document.createElement('input');
	input.setAttribute('type', 'date');
	var notADateValue = 'not-a-date';
	input.setAttribute('value', notADateValue);
	return input.value === notADateValue;
}
