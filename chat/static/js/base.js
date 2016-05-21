navigator.getUserMedia =  navigator.getUserMedia|| navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var USER_REGEX = /^[a-zA-Z-_0-9]{1,16}$/;
var HISTORY_STORAGE_NAME = 'history';
var MAX_STORAGE_LENGTH = 3000;
var blankRegex = /^\s*$/;
var fileTypeRegex = /\.(\w+)(\?.*)?$/;
window.sound = 0;
window.loggingEnabled = true;
var growlHolder;
var ajaxLoader;
var linksRegex = /(https?:&#x2F;&#x2F;.+?(?=\s+|<br>|$))/g; /*http://anycharacter except end of text, <br> or space*/
var replaceLinkPattern = '<a href="$1" target="_blank">$1</a>';
var muteBtn;
var canvas;
const escapeMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"\n": '<br>',
	"/": '&#x2F;'
};
var volumeProportion = {
	0: 0,
	1: 0.15,
	2: 0.4,
	3: 1
};
var volumeIcons = {
	0: 'icon-volume-off',
	1: 'icon-volume-1',
	2: 'icon-volume-2',
	3: 'icon-volume-3'
};
var replaceHtmlRegex = new RegExp("["+Object.keys(escapeMap).join("")+"]",  "g");

var infoMessages = [
	"Did you know that you could paste multiple lines content by simply pressing shift+Enter?",
	"You can add smileys by clicking on bottom right icon. To close the smile container click outside of it or press escape",
	"You can send direct message to user just by clicking on username in user list or in messages. After his username appears in the left bottom " +
			"corner and your messages become green. To send messages to all you should click on X right by username",
	"You can also comment somebody's message. This will be shown to all users in current channel. Just click on message" +
			"and it's content appears in message text",
	"You have a feature to suggest or you lack some functionality? Click on purple pencil icon on top menu and write your " +
			"suggestion there",
	"Chat uses your browser cache to store messages. If you want to clear history and all cached messages just click " +
	"on red Floppy drive icon on the top menu",
	"You can view userprofile by clicking on icon left by username in user list. To edit your profile you need to register" +
	"and click on light green wrench icon on the top right corner",
	"You can change your randomly generated username by clicking on it on top menu"
];

var $ = function (id) {
	return document.getElementById(id);
};


window.browserVersion = (function () {
	var ua = navigator.userAgent, tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		return 'IE ' + (tem[1] || '');
	}
	if (M[1] === 'Chrome') {
		tem = ua.match(/\bOPR\/(\d+)/);
		if (tem != null) {
			return 'Opera ' + tem[1];
		}
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	if ((tem = ua.match(/version\/(\d+)/i)) != null) {
		M.splice(1, 1, tem[1]);
	}
	return M.join(' ');
})();


function getUrlParam(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
			results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function setUrlParam(name, value) {
	var prevValue = getUrlParam(name);
	window.history.pushState('page2', 'Title', prevValue == null ?
			getText(url.indexOf("?") >= 0 ? "{}&{}={}" : "{}?{}={}", window.location.href, name, value):
			window.location.href.replace(name + "=" + prevValue, name + "=" + value));
}

function onDocLoad(onload) {
	return document.addEventListener("DOMContentLoaded", onload);
}


function encodeHTML(html) {
	return html.replace(replaceHtmlRegex, function (s) {
		return escapeMap[s];
	});
}


function encodeAnchorsHTML(html) {
	//&#x2F;&#x2F; = // (already encoded by encodeHTML above)
    return encodeHTML(html).replace(linksRegex, replaceLinkPattern);
}


var CssUtils = {
	visibilityClass: 'hidden',
	hasClass: function(element, className){
		return element.className != null && element.className.indexOf(className) >= 0;
	},
	addClass: function (element, className) {
		if (!this.hasClass(element, className)) {
			var oldClassName = element.className;
			element.className = getText("{} {}", oldClassName.trim(), className);
		}
	},
	setOnOf: function(element, desiredClass, removeClasses) {
		var className = element.className;
		if (className == null) {
			element.className = desiredClass;
		} else {
			var replaceReg = new RegExp("(" + removeClasses.join("|") + ")", "g");
			className = className.replace(replaceReg, '');
			element.className = className + " " + desiredClass;
		}
	},
	removeClass: function (element, className) {
		if (this.hasClass(element, className)) {
			element.className = element.className.replace(className, '');
		}
	},
	showElement: function (element) {
		this.removeClass(element, this.visibilityClass)
	},
	hideElement: function (element) {
		this.addClass(element, this.visibilityClass);
	},
	toggleVisibility: function (element) {
		this.toggleClass(element,this.visibilityClass);
	},
	setVisibility: function(element, isVisible){
		if (isVisible) {
			this.removeClass(element, this.visibilityClass);
		} else {
			this.addClass(element, this.visibilityClass);
		}
	},
	toggleClass: function (element, className) {
		if (this.hasClass(element, className)) {
			this.removeClass(element, className);
		} else {
			this.addClass(element, className);
		}
	}
};


var Growl = function (message) {
	var self = this;
	self.growlHolder = growlHolder;
	self.message = message.trim();
	self.error = function () {
		self.show(4000, 'col-error')
	};
	self.success = function () {
		self.show(3000, 'col-success')
	};
	self.info = function () {
		self.show(3000, 'col-info');
	};
	self.hide = function () {
		self.growl.style.opacity = 0;
		setTimeout(self.remove, 500); // 500 = $(.growl):transition 0.5s
	};
	self.remove = function () {
		if (self.growl.parentNode === self.growlHolder) {
			self.growlHolder.removeChild(self.growl)
		}
	};
	self.show = function (baseTime, growlClass) {
		var timeout = baseTime + self.message.length * 50;
		self.growl = document.createElement('div');
		self.growl.innerHTML = self.message.indexOf("<") == 0? self.message : encodeAnchorsHTML(self.message);
		self.growl.className = 'growl ' + growlClass;
		self.growlHolder.appendChild(self.growl);
		self.growl.clientHeight; // request to paint now!
		self.growl.style.opacity += 1;
		self.growl.onclick = self.hide;
		setTimeout(self.hide, timeout);
	};

};


function growlSuccess(message) {
	new Growl(message).success();
}

function growlError(message) {
	new Growl(message).error();
}

function growlInfo(message) {
	new Growl(message).info();
}


// TODO replace with HTML5 if possible
function Draggable(container, header) {
	var self = this;
	self.container = container;
	self.header = header;
	self.attached = true;
	self.eleMouseDown = function (ev) {
		self.leftCorrection =  container.offsetLeft - ev.pageX;
		self.topCorrection = container.offsetTop - ev.pageY;
		// TODO 7 is kind of magical bottom margin when source is attached to video
		self.maxTop = document.body.clientHeight - container.clientHeight - 7;
		self.maxLeft =  document.body.clientWidth - container.clientWidth;
		document.addEventListener ("mousemove", self.eleMouseMove, false);
	};
	self.eleMouseMove = function (ev) {
		var left = ev.pageX + self.leftCorrection;
		if (left < 0) {
			left = 0;
		} else if (left > self.maxLeft) {
			left = self.maxLeft;
		}
		self.container.style.left = left + "px";
		var top = ev.pageY + self.topCorrection;
		if (top < 0) {
			top = 0;
		} else if (top > self.maxTop) {
			top = self.maxTop;
		}
		self.container.style.top = top + "px";
		if (self.attached) {
			document.addEventListener ("mouseup", self.eleMouseUp, false);
			self.attached = false;
		}
	};
	self.eleMouseUp = function () {
		document.removeEventListener ("mousemove", self.eleMouseMove, false);
		document.removeEventListener ("mouseup", self.eleMouseUp, false);
		self.attached = true;
	};
	self.header.addEventListener ("mousedown", self.eleMouseDown, false);
}


onDocLoad(function () {
	muteBtn = $("muteBtn");
	mute();
	var theme = localStorage.getItem('theme');
	if (theme != null) {
		document.body.className = theme;
	}
	ajaxLoader = $("ajaxStatus");
	if (typeof InstallTrigger !== 'undefined') { // browser = firefox
		console.warn(getDebugMessage("Ops, there's no scrollbar for firefox"));
	}
	growlHolder = $('growlHolder');
	canvas = document.querySelector('canvas');
});


function mute() {
	window.sound = (window.sound + 1) % 4;
	if (muteBtn) muteBtn.className = volumeIcons[window.sound];
}


function login(event) {
	event.preventDefault();
	var callback = function (data) {
		if (data === RESPONSE_SUCCESS) {
			var nextUrl =getUrlParam('next');
			if (nextUrl == null) {
				nextUrl = '/';
			}
			window.location.href = nextUrl;
		} else {
			growlError(data);
		}
	};
	doPost('/auth', null, callback, loginForm);
}


function checkAndPlay(element) {
	if (!window.sound) {
		return;
	}
	try {
		element.pause();
		element.currentTime = 0;
		element.volume = volumeProportion[window.sound];
		element.play();
	} catch (e) {
		console.error(getDebugMessage("Skipping playing message, because {}", e.message || e));
	}
}


function readCookie(name, c, C, i) {
	c = document.cookie.split('; ');
	var cookies = {};
	for (i = c.length - 1; i >= 0; i--) {
		C = c[i].split('=');
		cookies[C[0]] = C[1];
	}
	var cookie = cookies[name];
	if (cookie != null) {
		var length = cookie.length - 1;
		// if cookie is wrapped with quotes (for ex api)
		if (cookie[0] === '"' && cookie[length] === '"') {
			cookie = cookie.substring(1, length);
		}
	}
	return cookie;
}

function ajaxShow() {
	ajaxLoader.className = 'show';
}

function ajaxHide() {
	ajaxLoader.className = '';
}

/**
 * @param params : object dict of params or DOM form
 * @param callback : function calls on response
 * @param url : string url to post
 * @param form : form in canse form is used
 * */
function doPost(url, params, callback, form) {
	var r = new XMLHttpRequest();
	r.onreadystatechange = function () {
		if (r.readyState === 4) {
			if (r.status === 200) {
				console.log(getDebugMessage("POST {} in: {};", url, r.response));
			} else {
				console.error(getDebugMessage("POST {} in: {}, status:", url, r.response, r.status));
			}
			if (typeof(callback) === "function") {
				callback(r.response);
			} else {
				console.warn(getDebugMessage("Skipping {} callback for POST {}", callback, url));
			}
		}
	};
	/*Firefox doesn't accept null*/
	var data = form == null ? new FormData() : new FormData(form);

	if (params) {
		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				data.append(key, params[key]);
			}
		}
	}
	if (url === "") {
		url = window.location.href ; // f*cking IE
	}
	r.open("POST", url, true);
	r.setRequestHeader("X-CSRFToken", readCookie("csrftoken"));
	console.log(getDebugMessage("POST {} out: {}", url, params));
	r.send(data);
}


/**
 * Loads file from server on runtime */
function doGet(fileUrl, callback) {
	var regexRes = fileTypeRegex.exec(fileUrl);
	var fileType = regexRes != null && regexRes.length === 3 ? regexRes[1] : null;
	var fileRef = null;
	switch (fileType) {
		case 'js':
			fileRef = document.createElement('script');
			fileRef.setAttribute("type", "text/javascript");
			fileRef.setAttribute("src", fileUrl);
			break;
		case 'css':
			fileRef = document.createElement("link");
			fileRef.setAttribute("rel", "stylesheet");
			fileRef.setAttribute("type", "text/css");
			fileRef.setAttribute("href", fileUrl);
			break;
		case 'json':
		default:
			var xobj = new XMLHttpRequest();
			// special for IE
			if (xobj.overrideMimeType) {
				xobj.overrideMimeType("application/json");
			}
			xobj.open('GET', fileUrl, true); // Replace 'my_data' with the path to your file
			xobj.onreadystatechange = function () {
				if (xobj.readyState === 4 && xobj.status === 200) {
					if (callback) {
						callback(xobj.responseText);
					}
				}
			};
			xobj.send(null);
	}
	if (fileRef) {
		document.getElementsByTagName("head")[0].appendChild(fileRef);
		fileRef.onload = callback;
	}
}


function saveLogToStorage(result) {
	if (!window.loggingEnabled) {
		return;
	}
	var storageInfo = localStorage.getItem(HISTORY_STORAGE_NAME);
	var newStorage;
	if (storageInfo == null) {
		newStorage = result;
	} else if (storageInfo.length > MAX_STORAGE_LENGTH) {
		var notConcatInfo = storageInfo +';;;'+ result;
		newStorage = notConcatInfo.substr(notConcatInfo.length - MAX_STORAGE_LENGTH, notConcatInfo.length);
	} else {
		newStorage = storageInfo + ';;;' + result;
	}
	localStorage.setItem(HISTORY_STORAGE_NAME, newStorage);
}


function getText() {
	for (var i = 1; i < arguments.length; i++) {
		arguments[0] = arguments[0].replace('{}', arguments[i]);
	}
	return arguments[0]
}


/** in 23 - out 23
 *  */
function sliceZero(number, count) {
	return String("00" + number).slice(count || -2);
}


/**
 *
 * Formats message for debug,
 * Usage getDebugMessage("{} is {}", 'war', 'bad');
 * @returns: "15:09:31:009: war is bad"
 *  */
function getDebugMessage() {
	var now = new Date();
	// first argument is format, others are params
	var text = getText.apply(this, arguments);
	var result = getText("{}:{}:{}.{}: {}",
			sliceZero(now.getHours()),
			sliceZero(now.getMinutes()),
			sliceZero(now.getSeconds()),
			sliceZero(now.getMilliseconds(), -3),
			text
	);
	saveLogToStorage(result);
	return result;
}


window.onerror = function (msg, url, linenumber) {
	var message = getText('Error occurred in {}:{}\n{}', url, linenumber, msg);
	console.error(getDebugMessage(message));
	growlError(message);
	return true;
};