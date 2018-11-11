import { Platform } from "./controllers/Platform";
import msgpack from "msgpack-lite";

// Type definitions for httpRequest parameters
export type httpMethodTypes = ("GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH");
type xhrResponseTypes = ("" | "arraybuffer" | "blob" | "document" | "json" | "text");
type fileReaderTypes = ("readAsArrayBuffer" | "readAsBinaryString" | "readAsDataURL" | "readAsText");


/** Base HTTP requests function, with binary support
 * @param url Absolute URL of the request
 * @param type HTTP request method (defaults to "GET")
 * @param data HTTP request body data
 * @param headers Object representing any desired HTTP headers
 * @param responseType XHR response type
 * @param readerType FileReader method with which to read the response
 * @returns Promise object representing response data
 */
function httpRequest (url: string, type: httpMethodTypes, data: any, headers: object, responseType?: xhrResponseTypes, readerType?: fileReaderTypes): Promise<any> {
	type = type || "GET";
	headers = headers || {};
	responseType = responseType || "blob";
	readerType = readerType || "readAsArrayBuffer";

	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open(type, url);

		let jwtToken = window.sessionStorage.getItem("jwtToken") || window.localStorage.getItem("jwtToken");
		if (jwtToken) xhr.setRequestHeader("Authorization", "JWT " + jwtToken);

		for (let key in headers) xhr.setRequestHeader(key, headers[key]);
		xhr.responseType = responseType;

		xhr.onload = function () {
			var status = [200, 201, 204].indexOf(this.status) !== -1;

			if (this.response.size && responseType == "blob") {
				let fileReader = new FileReader();

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


/**
 * API (MessagePack) requests function
 * @param url Request URL relative to API root
 * @param type HTTP request method (defaults to "GET")
 * @param data HTTP request body data
 * @returns Promise object representing API response
 */
export function apiRequest (url: string, type?: httpMethodTypes, data?: any): Promise<any> {
	var encData: Blob;
	if (data) encData = new Blob([msgpack.encode(data)]);
	else encData = null;

	var headers = {};
	if (type != "DELETE") headers["Accept"] = "application/msgpack";
	if (data) headers["Content-Type"] = "application/msgpack";

	return new Promise((resolve, reject) => {
		httpRequest(Platform.urls.serverUrl + "api/" + url, type, encData, headers).then((data) => {
			if (type == "DELETE") {
				resolve();
				return;
			}

			let byteArray = new Uint8Array(data);
			try {
				let resData = msgpack.decode(byteArray);
				resolve(resData);
			} catch (error) {
				reject(error);
			}
		}).catch(function (error) {
			try {
				let byteArray = new Uint8Array(error);
				let resData = msgpack.decode(byteArray);
				reject(resData);
			} catch (err) {
				reject(error);
			}
		});
	});
}


/**
 * Base64 data url requests function
 * @param url Request URL (relative to server root)
 */
export function mediaRequest (url: string): Promise<string> {
	return httpRequest(Platform.urls.serverUrl + url, "GET", null, null, "blob", "readAsDataURL");
}


// Modifications to the Promise prototype to add progress-tracking (for chain promises)

declare global {
	interface Promise<T> {
		/**
		 * Progress report run before starting each item
		 * @param data Data about current progress
		 * @param data.item Item about to be completed
		 * @param data.result Current result of chain operation
		 * @param data.doneCount Number of items completed
		 * @param data.totalCount Number of items remaining
		 */
		onbeforeprogress: (data: {item: any, result: T, doneCount: number, totalCount: number}) => void

		/**
		 * Progress report run after completing each item
		 * @param data Data about current progress
		 * @param data.item Item about to be completed
		 * @param data.result Current result of chain operation
		 * @param data.doneCount Number of items completed
		 * @param data.totalCount Number of items remaining
		 */
		onafterprogress: (data: {item: any, result: T, doneCount: number, totalCount: number}) => void

		/**
		 * Register a callback to be run upon progress events - NOTE .progress() must come before .then()
		 * @param callback Function to be run on each progress event
		 * @param before If true, the callback will be run before each item is started. If false, it will be run after each item is completed.
		 * @returns Promise object representing the main chain promise
		 */
		progress: (callback: (data: {item: any, result: T, doneCount: number, totalCount: number}) => void, before: boolean) => Promise<T>
	}
};

Promise.prototype.progress = function (callback, before) {
	if (before) this.onbeforeprogress = callback;
	else this.onafterprogress = callback;
	return this;
};


/**
 * Chain-execute a Promise-based function on a list of input objects
 * @param list List of objects upon which to execute the function
 * @param callback Promise-based function to run upon each object
 * @param result Initial value for the result, to be passed through each step in the chain execution
 * @returns Final result from chain execution
 */
function promiseChain<T, U, V> (list: T[], callback: (resolve: (data: U) => void, reject: (error: V) => void, item: T, accumulator: U) => void, result?: U): Promise<any> {
	// TODO figure out error-catching with this
	var done = 0;
	var finalPromise = list.reduce((promiseChain: Promise<U>, item: T) => {
		return promiseChain.then((accumulator: U) => {
			if (finalPromise.onbeforeprogress) finalPromise.onbeforeprogress({item: item, result: accumulator, doneCount: done, totalCount: list.length});
			return new Promise((resolve, reject) => {
				callback((data: U) => {
					done++;
					if (finalPromise.onafterprogress) finalPromise.onafterprogress({item: item, result: data, doneCount: done, totalCount: list.length});
					resolve(data);
				}, reject, item, accumulator);
			});
		});
	}, Promise.resolve(result));
	return finalPromise;
}


/**
 * Extract base64 data URL from <img> element
 * @param img <img> element from which to extract the base64 data URL
 * @returns Data URL of the current image
 */
function getBase64Image (img: HTMLImageElement): string {
	let canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	canvas.getContext("2d").drawImage(img, 0, 0);
	return canvas.toDataURL("image/jpeg");
}


/**
 * Extract rotated base64 data URL from img element
 * @param img <img> element to rotate
 * @param angle Angle (in degrees) of rotation
 * @returns Data URL of the rotated image
 */
function getRotatedImage (img: HTMLImageElement, angle: number): string {
	let canvas = document.createElement("canvas");
	let ctx = canvas.getContext("2d");

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



/** Get the numerical (float) value from a CSS string value
 * @param styleStr The string, in format "{number}px"
 * @returns Numerical value of the CSS string
*/
function getStyleValue (styleStr: string): number {
	if (styleStr == "") return 0;
	return parseFloat(styleStr.substring(0, styleStr.length - 2));
}


/**
 * Trim slashes from URL
 * @param url Un-formatted URL
 * @returns Trimmed URL
 */
function trimUrl (url: string): string {
	url = url || "";
	if (url.startsWith("/")) url = url.substr(1);
	if (url.indexOf("?") == -1) {
		if (url.endsWith("/")) url = url.substr(0, url.length - 1);
		url += "/";
	}
	return url;
}


/**
 * Add query parameters to an existing URL
 * @param oldUrl Main URL, possibly with existing query parameters
 * @param keepQuery Whether to keep existing query parameters
 * @param newQuery Object representing new query parameters to be added
 * @returns New URL, with query added
 */
function getUrl (oldUrl?: string, keepQuery?: boolean, newQuery?: object): string {
	oldUrl = oldUrl || Platform.urls.getCurrentAddress();
	let qIndex = oldUrl.indexOf("?");
	let queryParams: URLSearchParams, newUrl: string;
	if (qIndex != -1) {
		queryParams = new URLSearchParams(keepQuery ? oldUrl.substr(qIndex) : null);
		newUrl = oldUrl.substr(0, qIndex);
	} else {
		queryParams = new URLSearchParams();
		newUrl = oldUrl;
	}

	for (let key in newQuery) queryParams.set(key, newQuery[key]);

	newUrl += "?" + queryParams.toString().replace(/\+/g, "%20");

	return newUrl;
}


/**
 * Add an apendix to a URL
 * @param oldUrl URL to add to (with or without query string)
 * @param appendix Appendix to add
 * @returns New URL with appendix added
 */
function addToUrl (oldUrl: string, appendix: string): string {
	if (oldUrl.indexOf("?") == -1) {
		return oldUrl + appendix;
	} else {
		return oldUrl.replace("?", appendix + "?");
	}
}


/**
 * Display a bytes size using metric prefixes
 * @param size Size measurement in bytes
 * @returns Display-formatted version with appropriate SI prefix
 */
function displaySize (size: number): string {
	const siPrefs = ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei"];
	let siBase = Math.floor(Math.floor(Math.log2(size)) / 10);
	let siNum = (size / Math.pow(1024, siBase)).toPrecision(3);
	if (size == 0) {
		siNum = "0";
		siBase = 0;
	}
	return siNum + " " + siPrefs[siBase] + "B";
}


/**
 * Replace an item with a backup default if it is undefined or null
 * @param first First-choice item
 * @param second Backup choice
 * @returns First item if it is defined and non-null, otherwise second item
 */
function ifDefElse<T> (first: T, second: T): T {
	if (first === null || first === undefined) return second;
	else return first;
}
