var serverUrl = window.localStorage.serverUrl;

function getPageUrl (page, query) {
	return page + ".html" + (query ? ("?" + query) : "");
}

function getCurrentAddress () {
	return new URLSearchParams(window.location.search).get("address") || "";
}

function getCurrentQuery () {
	let params = new URLSearchParams(window.location.search);
	params.delete("address");
	return params.toString();
}

function getDisplayUrl (url) {
	var query;
	if (url.indexOf("?") !== -1) {
		query = new URLSearchParams(url.substr(url.indexOf("?")));
		url = url.substr(0, url.indexOf("?"));
	} else query = new URLSearchParams();

	query.set("address", url);

	return "index.html?" + query.toString();
}

var fileTransfer;

document.addEventListener("deviceready", function () {
	fileTransfer = new FileTransfer();
}, false);



/* var serverUrl = "https://zsmith.ddns.net/fileserver/";

//Encode filename for a URL
function urlEncode(name) {
	return encodeURI(name).replace(/'/g, "%27").replace(/&/g, "%26");
}

//Sync current folder (if applicable)
function openSyncFolder() {
	if (typeof(folderType) !== "undefined" && folderType == "folder") {
		folderPath =  new URLSearchParams(window.location.search).get("folder");
		window.location = "sync.html?remote=" + urlEncode(folderPath);
	}
}

//TODO https://github.com/katzer/cordova-plugin-local-notifications (seems to work when app minimised)
//cordova run android and chrome://inspect/#devices

document.addEventListener("deviceready", function (e) {
	console.log("ready");

	deviceReady = true;
	fileTransfer = new FileTransfer();

	if (toGetSave) getSaveData();
}, false);




//Below are not relevant in web platform

function onLoginFn() {}

function getImageSrc() {
	return false;
}

//Save data loaded from page
function saveGetData() {
	if (window.localStorage.getItem("saveDataOffline") != "true") return false;


	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
		fs.root.getFile("general_data.json", { create: true, exclusive: false }, function (file) {
			file.createWriter(function (fWriter) {
				fWriter.write(JSON.stringify(allData.general_data));
			});
		});
	});

	query = new URLSearchParams(window.location.search);
	query.delete("page");
	query.delete("fpp");
	query.sort();

	if (query.get("folder")) {
		dataFile = "/folder_data.json";
	} else if (query.get("album")) {
		dataFile = "/album_data.json";
	} else if (query.get("person")) {
		dataFile = "/person_data.json";
	}

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
		fs.root.getFile(dataFile, {create: true, exclusive: false}, function (fileEntry) {
			fileEntry.file(function (file) {
				fReader = new FileReader();
				fReader.onloadend = function() {
					if (this.result) fileData = JSON.parse(this.result);
					else fileData = {};

					fileData[query] = {page_meta: allData.page_meta, page_data: allData.page_data};
					fileEntry.createWriter(function (fWriter) {
						fWriter.write(JSON.stringify(fileData));
					});
				};
				fReader.readAsText(file);
			});
		});
	});
}

//Load data from saved page
function getSaveData() {
	if (window.localStorage.getItem("saveDataOffline") != "true") return false;
	if (!deviceReady) {
		toGetSave = true;
		return true;
	}

	query = new URLSearchParams(window.location.search);
	query.delete("page");
	query.delete("fpp");
	query.sort();

	if (query.get("folder")) {
		dataFile = "/folder_data.json";
	} else if (query.get("album")) {
		dataFile = "/album_data.json";
	} else if (query.get("person")) {
		dataFile = "/person_data.json";
	}

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
		fs.root.getFile("general_data.json", {create: true, exclusive: false}, function (fileEntry) {
			fileEntry.file(function (file) {
				fReader = new FileReader();
				fReader.onloadend = function() {
					if (this.result) generalData = JSON.parse(this.result);
					else  {
						$("#errorModal").modal("open");
						return;
					}

					fs.root.getFile(dataFile, {create: true, exclusive: false}, function (fileEntry) {
						fileEntry.file(function (file) {
							fReader = new FileReader();
							fReader.onloadend = function() {
								if (this.result) fileData = JSON.parse(this.result);
								else {
									$("#errorModal").modal("open");
									return;
								}

								if (query in fileData) {
									allData = {general_data: generalData, page_meta: fileData[query].page_meta, page_data: fileData[query].page_data};

									extractData();

									refreshPage();

									allDataLoaded = true;
									loadingData = false;
								} else {
									$("#errorModal").modal("open");
								}
							};
							fReader.readAsText(file);
						});
					});
				};
				fReader.readAsText(file);
			});
		});
	});

	return true;
}

var deviceReady = false;
var toGetSave = false;
var fileTransfer;

//TODO test all this
 */