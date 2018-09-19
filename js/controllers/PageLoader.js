// Class to handle page loading/refreshing
class PageLoader {
	constructor (filesContainer, filesMap) {
		// Containers
		this.filesContainer = filesContainer;
		this.filesMap = filesMap;

		// Notification snackbar
		this.snackbar = new mdc.snackbar.MDCSnackbar($("#snackbar").get(0));

		// Page state data
		this.data = {
			_data: {
				albumId: -1,
				personId: -1,
				folderData: {},
				loaded: {
					get all () { return this.albums && this.people && this.geotags; },
					albums: false,
					people: false,
					geotags: false
				}
			},

			viewName: "files",
			view: new FilesView(this),
			queryParams: new URLSearchParams(getCurrentQuery()),

			get folderType () {
				let urlList = trimUrl(getCurrentAddress()).split("/");
				return urlList[0] + (urlList.length > 2 ? "" : "-root");
			},
			get objectType () {
				switch (this.folderType) {
				case "people-root":
					return "people";
				case "people":
					return "faces";
				default:
					return "files";
				}
			},
			get address () { return this.currentRootObject.path || this.currentRootObject.full_name || "/"; },
			get apiUrl () {
				if (this._data.albumId == -1 && this._data.personId == -1 && !Object.getOwnPropertyNames(this._data.folderData).length) return null;
				else return trimUrl(this.folderType + "/" + notNull(this.currentRootObject.id, "")) + (this.queryParams.toString() ? ("?" + this.queryParams.toString()): "");
			},

			get album () { return Album.getById(this._data.albumId) || null; },
			get person () { return Person.getById(this._data.personId) || null; },
			get folder () {
				switch (this.folderType) {
				case "folders-root":
					return new FileObject({name: "Root Folders", type: "folder", length: 0});
				case "folders":
					return new FileObject(this._data.folderData);
				default:
					return null;
				}
			},
			get currentRootObject () { return this.folder || this.album || this.person || {}; },

			get objectCount () { return pageLoader.filesContainer.sortedFiles.length || pageLoader.filesContainer.sortedFiles.length || 0; }
		};
	}

	init() {
		let loader = this;
		apiRequest("membership/status/").then(function (data) {
			if (data.authenticated) {
				$("#optionsButton-menu-username").get(0).innerText = data.user.full_name;

				window.sessionStorage.setItem("csrf_token", data.csrf_token);

				loader.refreshConfig().then(function () {
					loader.refreshGeneralData();
				});
			} else {
				loader.logOut();
			}
		}).catch(function () {
			window.sessionStorage.removeItem("jwtToken");
			window.localStorage.removeItem("jwtToken");
			window.location = getPageUrl("login");
		});
	}

	logOut () {
		window.localStorage.removeItem("jwtToken");
		window.sessionStorage.removeItem("jwtToken");
		window.location = getPageUrl("login");
	}

	refreshConfig () {
		let parent = this;
		return new Promise(function (resolve, reject) {
			apiRequest("membership/config/").then(function (data) {
				parent.config = new Config(data);

				sortBar.init();
				sortBar.refresh();

				//TODO add min/max/etc. to the API request maybe

				resolve();
			});
		});
	}

	refreshGeneralData () {
		let parent = this;

		apiRequest("albums/").then(function (data) {
			Album.albums = Album.createFromList(data);
			navigationDrawer.refreshAlbums();

			parent.data._data.loaded.albums = true;
			if (parent.data._data.loaded.all) parent.onLoadedMetadata();
		});

		apiRequest("people-groups/").then(function (data) {
			PersonGroup.groups = PersonGroup.createFromList(data);
			navigationDrawer.refreshPeople();

			if (parent.data.folderType == "people-root") {
				parent.refreshPeople();
			}

			parent.data._data.loaded.people = true;
			if (parent.data._data.loaded.all) parent.onLoadedMetadata();
		});

		apiRequest("geotag-areas/").then(function (data) {
			GeoTagArea.areas = GeoTagArea.createFromList(data);
			navigationDrawer.refreshGeoTagAreas();

			parent.data._data.loaded.geotags = true;
			if (parent.data._data.loaded.all) parent.onLoadedMetadata();
		});
	}

	onLoadedMetadata () {
		filterBar.refresh();
		this.refreshFilesData(null, null, null, "initial");
	}

	// Refresh the page URL
	refreshFilesData (displayUrl, apiUrl, queryParams, linkType) {
		$("#files .mdc-linear-progress").css("display", "");

		apiUrl = trimUrl(displayUrl ? apiUrl : (this.data.apiUrl || ""));
		displayUrl = trimUrl(displayUrl || getCurrentAddress() + getCurrentQuery());
		if (queryParams) {
			displayUrl = getUrl(displayUrl, !queryParams.removeOld, queryParams);
			if (apiUrl) apiUrl = getUrl(apiUrl, !queryParams.removeOld, queryParams);
		}
		if (apiUrl.length == 1) {
			if (displayUrl.length == 1) {
				apiUrl = "folders/";
				displayUrl = "folders/";
			} else if (displayUrl.indexOf("/") > displayUrl.length - 2) {
				apiUrl = displayUrl;
			} else {
				apiUrl = displayUrl.replace("?", "&").replace("/", "/?query=");
			}
		}

		// Load main page here
		// when loaded, download data for next and prev page
		// (the hard bit maybe) if files opened from next/prev page (by arrows) then load other pages so never run out
		// create a semirefresh method which tests if data is loaded for page and downloads or uses it


		if (displayUrl.indexOf("?") != -1) this.data.queryParams = new URLSearchParams(displayUrl.substr(displayUrl.indexOf("?")));
		else this.data.queryParams = new URLSearchParams();
		this.clearDefaultQueryParams();
		if (displayUrl.indexOf("?") != -1) displayUrl = displayUrl.substr(0, displayUrl.indexOf("?")) + (this.data.queryParams.toString() ? ("?" + this.data.queryParams.toString()) : "");
		else if (this.data.queryParams.toString()) displayUrl += "?" + this.data.queryParams.toString();

		this.setView(this.getQueryParam("view"), true);
		sortBar.refreshViewSwitcher();

		addressBar.refreshUrls(linkType);
		window.history.pushState("", "", getDisplayUrl(displayUrl));

		if (apiUrl == "people/") {
			if (this.data._data.loaded.people) this.refreshPeople();
			return;
		}

		$("#files > *:not(.mdc-linear-progress)").css("display", "none");

		let parent = this;
		apiRequest(apiUrl).then(function (data) {
			parent.data.view.refresh(data);
			addressBar.refresh();
		});
	}

	refreshPage (fpp, page) {
		if (page !== null) this.data.queryParams.set("page", page);
		if (fpp !== null) this.data.queryParams.set("fpp", fpp);
		this.clearDefaultQueryParams();

		window.history.pushState("", "", "/fileserver" + getCurrentAddress() + (this.data.queryParams.toString() ? ("?" + this.data.queryParams.toString()) : ""));

		this.data.view.refreshPage(fpp, page);
	}

	fetchPageFiles () {
		let page = this.getQueryParam("page");
		let parent = this;
		if (this.data.view.checkRange(this.getQueryParam("fpp") * (page - 1), this.getQueryParam("fpp") * page)) {
			let addFiles = function (data) { parent.data.view.addFiles(data); };
			if (page > 1 && !this.data.view.checkRange(this.getQueryParam("fpp") * (page - 2), this.getQueryParam("fpp") * (page - 1))) apiRequest(getUrl(addToUrl(this.data.apiUrl, pageLoader.data.objectType + "/"), true, {page: page - 1})).then(addFiles);
			if (page < Math.ceil(this.data.objectCount / this.getQueryParam("fpp")) && !this.data.view.checkRange(this.getQueryParam("fpp") * (page + 1), this.getQueryParam("fpp") * (page + 2))) apiRequest(getUrl(addToUrl(this.data.apiUrl, pageLoader.data.objectType + "/"), true, {page: page + 1})).then(addFiles);
		} else {
			apiRequest(addToUrl(this.data.apiUrl, pageLoader.data.objectType + "/")).then(function (data) {
				parent.data.view.addFiles(data);
				parent.data.view.refreshDisplay();
				parent.fetchPageFiles();
			});
		}
	}

	// Refresh this.metadata (internal page metadata)
	refreshMetadata (data) {
		if (this.data.folderType == "albums") this.data._data.albumId = data.id;
		else this.data._data.albumId = -1;
		if (this.data.folderType == "people") this.data._data.personId = data.id;
		else this.data._data.personId = -1;
		if (this.data.folderType == "folders") {
			this.data._data.folderData = Object.assign({}, data);
			delete this.data._data.folderData.folders;
			delete this.data._data.folderData.files;
		} else this.data._data.folderData = {};
	}

	refreshPeople () {
		this.filesContainer.refreshGroups(PersonGroup.groups);

		$("#files .mdc-linear-progress").css("display", "none");
	}

	setView (view, noRefresh) {
		this.data.viewName = view;

		if (view == "files") {
			this.data.view = new FilesView(this);
		} else if (view == "map") {
			this.data.view = new MapView(this);
		}

		if (!noRefresh) this.refreshFilesData(getCurrentAddress() + "?view=" + view);
	}

	clearDefaultQueryParams () {
		if (!this.data.queryParams.get("fpp")) this.data.queryParams.set("fpp", PageLoader.queryParamDefaults.fpp);

		for (var key in PageLoader.queryParamDefaults) {
			if (this.data.queryParams.get(key) == PageLoader.queryParamDefaults[key] && PageLoader.queryParamDefaults.toClear(key)) this.data.queryParams.delete(key);
		}
	}

	getQueryParam (key) {
		let value = this.data.queryParams.get(key) || PageLoader.queryParamDefaults[key] || null;
		if (value == "true") value = true;
		else if (value == "false") value = false;
		else if (!isNaN(parseFloat(value))) value = parseFloat(value);

		return value;
	}

	dismissSnackbar () {
		this.snackbar.foundation_.active_ = false;
		this.snackbar.foundation_.queue_ = [];
		$(this.snackbar.root_).removeClass("mdc-snackbar--active");
	}
}

PageLoader.queryParamDefaults = {
	toClear: function (param) {
		if (param == "fpp") return pageLoader.config.get("fpp") == pageLoader.config.defaults.fpp.default[pageLoader.config.platform];
		else return true;
	},
	view: "files",
	filter: "I*",
	isf: "false",
	page: 1,
	get fpp() { return pageLoader.config.get("fpp"); }
};
