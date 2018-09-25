$(document).ready(function () {
	queryString = new URLSearchParams(window.location.search);
	if (queryString.get("action") == "logout") {
		apiRequest("membership/logout/").then(function () {
			window.history.pushState("", "", "login");
		});
	} else {
		apiRequest("membership/status/").then(function (data) {
			if (data.authenticated) {
				window.location = Platform.urls.getPageUrl("index");
			}
		}).catch(function () {});
	}

	mdc.ripple.MDCRipple.attachTo($(".mdc-button").get(0));
});

function submitLogin () {
	data = {username: $("#username").val(), password: $("#password").val()};

	apiRequest("membership/login/", "POST", data).then(function (data) {
		if ($("#remain_in").get(0).checked) window.localStorage.setItem("jwtToken", data.token);
		else window.sessionStorage.setItem("jwtToken", data.token);
		window.location = Platform.urls.getPageUrl("index");
	}).catch(function (error) {
		$("#status").text("Incorrect Credentials.");
	});
}

// TODO google/ms login
