//Retrieve data on document ready
$(document).ready(function () {
	checkAuth(1000);
	$("select").material_select();
});

//Check user is logged in
function checkAuth(currentTimeout) {
	$.ajax({
		url: serverUrl + "api/feedback",
		success: function (data) {
			if (data.auth === false) {
				window.location = "login.html";
			}
			$("#fullpage-loader").css("display", "none");
		},
		error: function (xhr, error) {
			if (error == "timeout" && currentTimeout < 10000) {
				console.log("Request timed out. Retrying...");
				checkAuth(currentTimeout * 2);
			} else {
				$("#status").text("An unknown error occurred. Try refreshing the page.");
			}
		},
		timeout: currentTimeout
	});
}

//Submit user-entered feedback
function submitFeedback(currentTimeout) {
	$.ajax({
		url: serverUrl + "api/feedback",
		type: "post",
		data: $("#feedbackform").serialize(),
		success: function (data) {
			$("#status").text(data.status);
		},
		error: function (xhr, error) {
			if (error == "timeout" && currentTimeout < 10000) {
				console.log("POST request timed out. Retrying...");
				submitFeedback(currentTimeout * 2);
			} else {
				$("#status").text("A technical error occurred. Try refreshing the page.");
			}
		},
		timeout: currentTimeout
	});
}
