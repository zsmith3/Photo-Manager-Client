// Base HTTP requests function
function httpRequest (url, type, data, headers, responseType, readerType) {
	type = type || "GET";
	headers = headers || {};
	responseType = responseType || "blob";
	readerType = readerType || "readAsArrayBuffer";

	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open(type, url);
		var jwtToken = window.sessionStorage.getItem("jwtToken") || window.localStorage.getItem("jwtToken");
		if (jwtToken) xhr.setRequestHeader("Authorization", "JWT " + jwtToken);

		for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		xhr.responseType = responseType;

		xhr.onload = function () {
			var status = [200, 201, 204].indexOf(this.status) !== -1;

			if (this.response.size && responseType == "blob") {
				var fileReader = new FileReader();

				fileReader.onload = function () {
					if (status) resolve(this.result);
					else reject(this.result);
				};

				fileReader.onerror = reject;

				fileReader[readerType](this.response);
			} else if (status) resolve(this.response);
			else reject(this.response);
		};

		xhr.onerror = reject;

		xhr.send(data);
	});
}

// API (MessagePack) requests function
function apiRequest (url, type, data) {
	var encData;
	if (data) encData = new Blob([msgpack.encode(data)]);
	else encData = null;
	var headers = {};
	if (type != "DELETE") headers["Accept"] = "application/msgpack";
	if (data) headers["Content-Type"] = "application/msgpack";

	return new Promise(function (resolve, reject) {
		httpRequest(serverUrl + "api/" + url, type, encData, headers).then(function (data) {
			var byteArray = new Uint8Array(data);
			try {
				var resData = msgpack.decode(byteArray);
				resolve(resData);
			} catch (error) {
				reject(error);
			}
		}).catch(function (error) {
			try {
				var byteArray = new Uint8Array(error);
				var resData = msgpack.decode(byteArray);
				reject(resData);
			} catch (err) {
				reject(error);
			}
		});
	});
}

// Base64 data url requests function
function mediaRequest (url) {
	return new Promise (function (resolve, reject) {
		httpRequest(serverUrl + url, "GET", null, null, "blob", "readAsDataURL").then(resolve).catch(reject);
	});
}

// Chain-execute a set of Promise-based functions
function promiseChain (list, callback, result) {
	// TODO figure out error-catching with this
	var done = 0;
	var finalPromise = list.reduce(function (promiseChain, item) {
		return promiseChain.then(function (accumulator) {
			if (finalPromise.onbeforeprogress) finalPromise.onbeforeprogress({item: item, result: accumulator, doneCount: done, totalCount: list.length});
			return new Promise(function (resolve, reject) {
				callback(function (data) {
					done++;
					if (finalPromise.onafterprogress) finalPromise.onafterprogress({item: item, result: data, doneCount: done, totalCount: list.length});
					resolve(data);
				}, reject, item, accumulator);
			});
		});
	}, Promise.resolve(result));
	return finalPromise;
}

// Add progress-tracking event function to Promise prototype NOTE .progress() must come before .then()
Promise.prototype.progress = function (callback, before) {
	if (before) this.onbeforeprogress = callback;
	else this.onafterprogress = callback;
	return this;
};

// Extract base64 string from img element
function getBase64Image (img) {
	var canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	canvas.getContext("2d").drawImage(img, 0, 0);
	return canvas.toDataURL("image/jpeg");
}

// Extract rotated base64 string from img element
function getRotatedImage (img, angle) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	if (angle == 90 || angle == -90) {
		canvas.width = img.naturalHeight;
		canvas.height = img.naturalWidth;
	} else {
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
	}

	ctx.rotate(angle * Math.PI / 180);

	if (angle == 90) ctx.drawImage(img, 0, -img.naturalHeight);
	else if (angle == -90) ctx.drawImage(img, -img.naturalWidth, 0);
	else if (angle == 180) ctx.drawImage(img, -img.naturalWidth, -img.naturalHeight);
	else ctx.drawImage(img, 0, 0);

	return canvas.toDataURL("image/jpeg");
}

// Get value from string in px
function getStyleValue (styleStr) {
	if (styleStr == "") return 0;
	return parseFloat(styleStr.substring(0, styleStr.length - 2));
}

// Trim slashes from URL
function trimUrl (url) {
	url = url || "";
	if (url.startsWith("/")) url = url.substr(1);
	if (url.indexOf("?") == -1) {
		if (url.endsWith("/")) url = url.substr(0, url.length - 1);
		url += "/";
	}
	return url;
}

// Construct a new URL
function getUrl (oldUrl, keepQuery, newQuery) {
	oldUrl = oldUrl || getCurrentAddress();
	var qIndex = oldUrl.indexOf("?");
	var queryParams, newUrl;
	if (qIndex != -1) {
		queryParams = new URLSearchParams(keepQuery ? oldUrl.substr(qIndex) : null);
		newUrl = oldUrl.substr(0, qIndex);
	} else {
		queryParams = new URLSearchParams();
		newUrl = oldUrl;
	}

	for (var key in newQuery) queryParams.set(key, newQuery[key]);

	newUrl += "?" + queryParams.toString().replace(/\+/g, "%20");

	return newUrl;
}

// Add an apendix to a URL (with or without query string)
function addToUrl (oldUrl, appendix) {
	if (oldUrl.indexOf("?") == -1) {
		return oldUrl + appendix;
	} else {
		return oldUrl.replace("?", appendix + "?");
	}
}

// Display a bytes size using metric prefixes
function displaySize (size) {
	siPrefs = ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei"];
	siBase = Math.floor(Math.floor(Math.log2(size)) / 10);
	siNum = (size / Math.pow(1024, siBase)).toPrecision(3);
	if (size == 0) {
		siNum = 0;
		siBase = 0;
	}
	outStr = siNum + " " + siPrefs[siBase] + "B";
	return outStr;
}

// Give an item only if it is non-null
function notNull (item, other) {
	if (item === null || item === undefined) return other;
	else return item;
}
