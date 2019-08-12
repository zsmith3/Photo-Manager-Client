import * as msgpack from "msgpack-lite";
import { Platform } from "./controllers/Platform";

// Type definitions for httpRequest parameters
export type httpMethodTypes = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
type xhrResponseTypes = "" | "arraybuffer" | "blob" | "document" | "json" | "text";
type fileReaderTypes = "readAsArrayBuffer" | "readAsBinaryString" | "readAsDataURL" | "readAsText";

/** Base HTTP requests function, with binary support
 * @param url Absolute URL of the request
 * @param type HTTP request method (default = "GET")
 * @param data HTTP request body data
 * @param headers Object representing any desired HTTP headers
 * @param responseType XHR response type (default = "blob")
 * @param readerType FileReader method with which to read the response (default = "readAsArrayBuffer")
 * @returns Promise object representing response data
 */
function httpRequest(
	url: string,
	type: httpMethodTypes = "GET",
	data: any = null,
	headers: {} = {},
	responseType: xhrResponseTypes = "blob",
	readerType: fileReaderTypes = "readAsArrayBuffer"
): Promise<any> {
	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open(type, url);

		let jwtToken = window.sessionStorage.getItem("jwtToken") || window.localStorage.getItem("jwtToken");
		if (jwtToken) xhr.setRequestHeader("Authorization", "JWT " + jwtToken);

		for (let key in headers) xhr.setRequestHeader(key, headers[key]);
		xhr.responseType = responseType;

		xhr.onload = function() {
			var status = [200, 201, 204].includes(this.status);

			if (this.response && this.response.size && responseType == "blob") {
				let fileReader = new FileReader();

				fileReader.onload = function() {
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
 * API requests function.
 * Uses MessagePack in production, JSON in development.
 * @param url Request URL relative to API root
 * @param type HTTP request method (defaults to "GET")
 * @param data HTTP request body data
 * @returns Promise object representing API response
 */
export function apiRequest(url: string, type?: httpMethodTypes, data?: any): Promise<any> {
	var encData;
	if (process.env.NODE_ENV === "production") {
		if (data) encData = new Blob([msgpack.encode(data)]);
		else encData = null;
	} else encData = JSON.stringify(data);

	var headers = {};
	if (process.env.NODE_ENV === "production") {
		if (type != "DELETE") headers["Accept"] = "application/msgpack";
		if (data) headers["Content-Type"] = "application/msgpack";
	} else if (data) headers["Content-Type"] = "application/json";

	return new Promise((resolve, reject) => {
		let request: Promise<any>;
		if (process.env.NODE_ENV === "production") request = httpRequest(Platform.urls.serverUrl + "api/" + url, type, encData, headers);
		else request = httpRequest(Platform.urls.serverUrl + "api/" + url, type, encData, headers, "json");
		request
			.then(data => {
				if (type == "DELETE") {
					resolve();
					return;
				}

				decodeData(data, resolve, reject);
			})
			.catch(function(error) {
				decodeData(error, reject, reject);
			});
	});
}

/**
 * Decode API data.
 * Uses MessagePack in production, JSON in development.
 * @param data Data to be decoded
 * @param onsuccess Function to run on successful decoding
 * @param onerror Function to run on error
 */
function decodeData(data: any, onsuccess: (data: any) => void, onerror: (data: any) => void) {
	if (process.env.NODE_ENV === "production") {
		try {
			let byteArray = new Uint8Array(data);
			let resData = msgpack.decode(byteArray);
			onsuccess(resData);
		} catch (err) {
			onerror(err);
		}
	} else {
		onsuccess(data);
	}
}

/**
 * Base64 data url requests function
 * @param url Request URL (relative to server root)
 */
export function mediaRequest(url: string): Promise<string> {
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
		onbeforeprogress: (data: { item: any; result: T; doneCount: number; totalCount: number }) => void;

		/**
		 * Progress report run after completing each item
		 * @param data Data about current progress
		 * @param data.item Item about to be completed
		 * @param data.result Current result of chain operation
		 * @param data.doneCount Number of items completed
		 * @param data.totalCount Number of items remaining
		 */
		onafterprogress: (data: { item: any; result: T; doneCount: number; totalCount: number }) => void;

		/**
		 * Register a callback to be run upon progress events - NOTE .progress() must come before .then()
		 * @param callback Function to be run on each progress event
		 * @param before If true, the callback will be run before each item is started. If false, it will be run after each item is completed.
		 * @returns Promise object representing the main chain promise
		 */
		progress: (callback: (data: { item: any; result: T; doneCount: number; totalCount: number }) => void, before: boolean) => Promise<T>;
	}
}

Promise.prototype.progress = function(callback, before) {
	if (before) this.onbeforeprogress = callback;
	else this.onafterprogress = callback;
	return this;
};

/**
 * Trim a specific character from a string
 * @param str The string to trim
 * @param char The character to remove
 * @param end Which end of the string to trim (defaults to both)
 */
export function trimStr(str: string, char: string, end: "l" | "r" | "lr" | "rl" = "lr") {
	if (end.includes("l")) {
		while (str.startsWith(char)) str = str.substr(1);
	}
	if (end.includes("r")) {
		while (str.endsWith(char)) str = str.substr(0, str.length - 1);
	}
	return str;
}

/**
 * Remove empty items from a URL query string
 * @param query The query to prune
 * @returns The pruned query
 */
export function pruneUrlQuery(query: URLSearchParams): URLSearchParams {
	let newQuery = new URLSearchParams(query.toString());
	let entries = newQuery.entries();
	while (true) {
		let next = entries.next();
		if (next.done) break;
		let pair = next.value;
		if (!pair[1]) newQuery.delete(pair[0]);
	}
	return newQuery;
}

/**
 * Chain-execute a Promise-based function on a list of input objects
 * @param list List of objects upon which to execute the function
 * @param callback Promise-based function to run upon each object
 * @param result Initial value for the result, to be passed through each step in the chain execution
 * @returns Final result from chain execution
 */
export function promiseChain<T, U, V>(
	list: T[],
	callback: (resolve: (data: U | void) => void, reject: (error: V) => void, item: T, accumulator: U) => void,
	result?: U
): Promise<any> {
	// TODO figure out error-catching with this
	var done = 0;
	var finalPromise = list.reduce((promiseChain: Promise<U>, item: T) => {
		return promiseChain.then((accumulator: U) => {
			if (finalPromise.onbeforeprogress)
				finalPromise.onbeforeprogress({
					item: item,
					result: accumulator,
					doneCount: done,
					totalCount: list.length
				});
			return new Promise((resolve, reject) => {
				callback(
					(data: U) => {
						done++;
						if (finalPromise.onafterprogress)
							finalPromise.onafterprogress({
								item: item,
								result: data,
								doneCount: done,
								totalCount: list.length
							});
						resolve(data);
					},
					reject,
					item,
					accumulator
				);
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
function getBase64Image(img: HTMLImageElement): string {
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
function getRotatedImage(img: HTMLImageElement, angle: number): string {
	let canvas = document.createElement("canvas");
	let ctx = canvas.getContext("2d");

	if (angle == 90 || angle == -90) {
		canvas.width = img.naturalHeight;
		canvas.height = img.naturalWidth;
	} else {
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
	}

	ctx.rotate((angle * Math.PI) / 180);

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
function getStyleValue(styleStr: string): number {
	if (styleStr == "") return 0;
	return parseFloat(styleStr.substring(0, styleStr.length - 2));
}

/**
 * Trim slashes from URL
 * @param url Un-formatted URL
 * @returns Trimmed URL
 */
function trimUrl(url: string): string {
	url = url || "";
	if (url.startsWith("/")) url = url.substr(1);
	if (!url.includes("?")) {
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
function getUrl(oldUrl?: string, keepQuery?: boolean, newQuery?: object): string {
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
function addToUrl(oldUrl: string, appendix: string): string {
	if (!oldUrl.includes("?")) {
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
function displaySize(size: number): string {
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
function ifDefElse<T>(first: T, second: T): T {
	if (first === null || first === undefined) return second;
	else return first;
}

/**
 * Extract the path, excluding search, from a URL
 * @param url URL with or without search
 * @returns Path-only URL
 */
export function getPathnameFromUrl(url: string): string {
	if (url.includes("?")) return url.substr(0, url.indexOf("?"));
	else return url;
}

/**
 * Extract the search from a URL
 * @param url URL with or without search
 * @returns Search params data
 */
export function getQueryFromUrl(url: string): URLSearchParams {
	if (url.includes("?")) return pruneUrlQuery(new URLSearchParams(url.substr(url.indexOf("?"))));
	else return new URLSearchParams();
}

/** Type for complex handler function */
type handleFnType = (contentData: any, successHandler: (data: any) => void, errorHandler: (error: any) => void) => void;

/** Class for update handler functions */
export class UpdateHandler {
	/** ID (for removal from list) */
	id: number;

	/** Standard handler function */
	successHandler: (data: any) => void;

	/** Handler function if data fetch fails */
	errorHandler?: (error: any) => void;

	/** Data about content to fetch */
	contentData?: any;

	/** Function to handle fetching data and running handlers */
	handleFn?: handleFnType;

	/** List to which this handler belongs */
	list: UpdateHandlerList;

	/** Whether handler is currently subscribed to */
	registered: boolean;

	constructor(
		id: number,
		handlerData: { successHandler: (data: any) => void; errorHandler?: (error: any) => void; contentData?: any; handleFn?: handleFnType },
		list: UpdateHandlerList
	) {
		this.id = id;
		this.successHandler = handlerData.successHandler;
		this.errorHandler = handlerData.errorHandler;
		this.contentData = handlerData.contentData;
		this.handleFn = handlerData.handleFn;
		this.list = list;
		this.registered = true;
	}

	/** Handle/invoke update */
	handle(data?: any) {
		if (this.handleFn) this.handleFn(this.contentData, this.successHandler, this.errorHandler);
		else this.successHandler(data);
	}

	/** Remove this handler */
	unregister() {
		this.list.unregister(this.id);
		this.registered = false;
	}
}

/** List of update handlers for some data */
export class UpdateHandlerList {
	/** ID of last handler added */
	lastID: number = 0;

	/** List of handler objects */
	list: UpdateHandler[] = [];

	/** (Optional) function to handle fetching data and running handlers */
	private handleFn?: handleFnType;

	/** Most recent value of data */
	lastData: any;

	constructor(data: any, handleFn?: handleFnType) {
		this.lastData = data;
		this.handleFn = handleFn;
	}

	/** Register new update handler */
	register(successHandler: (data: any) => void, errorHandler?: (error: any) => void, contentData?: any) {
		this.lastID++;
		let updateHandler = new UpdateHandler(this.lastID, { successHandler: successHandler, errorHandler: errorHandler, contentData: contentData, handleFn: this.handleFn }, this);
		this.list.push(updateHandler);
		updateHandler.handle(this.lastData);
		return updateHandler;
	}

	/** Unregister existing update handler */
	unregister(id: number) {
		this.list.splice(this.list.findIndex(item => item.id == id));
	}

	/** Handle/invoke an update to the data */
	handle(data?: any) {
		data = data || this.lastData;
		this.list.forEach(item => item.handle(data));
		this.lastData = data;
	}
}
