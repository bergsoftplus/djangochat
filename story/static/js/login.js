function login() {
	var d = new Date();
	var credentials = {
			username: document.getElementById("username").value,
			password: document.getElementById("password").value
	};
	console.log(d + "Attempting to login, credentials: " + credentials);
	$.ajax({
		url: 'auth',
		type: 'POST',
		data: credentials,
		success: function (data) {
			var d = new Date();
			console.log(d + "Server response success:" + data);
			if (data === 'update') {
				window.location.href = '/';
			} else {
				alert(data);
			}
		},
		failure: function (data) {
			var d = new Date();
			console.log(d + "can't login into system, response: " + data);
		}
	});

}

$(document).ready(function () {
		//Handles menu drop down
	var loginForm = $('#login-form');
	loginForm.click(function (e) {
		e.stopPropagation();
	});
	// login by enter
	loginForm.keypress(function (event) {
		if (event.keyCode === 13) {
			login();
		}
	});
});
