//Redirect if done
if (window.localStorage.getItem("serverUrl") !== null) {
	window.location = "index.html";
}

// Set the server to connect to in settings
function serverConnect() {
	window.localStorage.setItem("serverUrl", $("#serverurl").val());
	window.localStorage.setItem("sync", "[]");
	window.localStorage.setItem("toDownload", "[]");
	window.location = "index.html";
}
