var serverUrl = "";

function getPageUrl (page, query) {
	if (page == "index") page = "";
	return page + (query ? ("?" + query) : "");
}

function getCurrentAddress () {
	return window.location.pathname.substr(11);
}

function getCurrentQuery () {
	return window.location.search;
}

function getDisplayUrl (url) {
	return url;
}

/* //Encode filename for a URL
function urlEncode(name) {
	return encodeURI(name).replace(/'/g, "%27").replace(/&/g, "%26");
}

//Get value from string in px
function getSVal(styleStr) {
	if (styleStr == "") return 0;
	return parseFloat(styleStr.substring(0, styleStr.length - 2));
}

//Extract base64 string from img element
function getBase64Image(img) {
	canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	canvas.getContext("2d").drawImage(img, 0, 0);
	return canvas.toDataURL("image/png");
}

//Below are not relevant in web platform

function onLoginFn() {}

function getImageSrc() {
	return false;
}

function saveGetData() {}

function getSaveData() {
	return false;
}
 */