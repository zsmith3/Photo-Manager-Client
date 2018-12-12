import { createMuiTheme, CssBaseline, MuiThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";
import { Database } from "../controllers/Database";
import "../styles/App.css";
import LoginPage from "./LoginPage";
import MainPage from "./MainPage";


export type addressRootTypes = ("folders" | "albums" | "people");


// Hack to fix a bug
declare global {
	interface Window {
		React: any
	}
}
window.React = React;


export class LocationManager extends React.Component<{ history: any }> {
	static instance: LocationManager

	private static nextLocation: string = null

	static get currentLocation () {
		// TODO may need to add search to this
		if (this.nextLocation === null) return window.location.pathname;
		else return this.nextLocation;
	}

	static updateLocation (url: string) {
		if (LocationManager.instance) LocationManager.instance.props.history.push(url);
		else LocationManager.nextLocation = url;
	}

	constructor (props) {
		super(props);

		LocationManager.instance = this;

		if (LocationManager.nextLocation !== null) {
			LocationManager.updateLocation(LocationManager.nextLocation);
		}
	}

	render () {
		let Fragment = React.Fragment;

		if (LocationManager.nextLocation === null) {
			return <Fragment>
				{ this.props.children }
			</Fragment>
		} else {
			LocationManager.nextLocation = null;
			return <Fragment />;
		}
	}
}


// Class to handle the whole application
export default class App extends React.Component {
	// Singleton instance
	static app: App;

	static authCheckInterval: number

	static toLocation: string = null

	static theme = createMuiTheme({
		overrides: {
			MuiIconButton: {
				root: {
					padding: 6
				}
			}
		}
	});


	// Default values for query string parameters
	static queryParamDefaults = {
		toClear: function (param) {
			if (param == "fpp") return App.app.config.get("fpp") == App.app.config.defaults.fpp.default[App.app.config.platform];
			else return true;
		},
		view: "files",
		filter: "I*",
		isf: "false",
		page: 1,
		get fpp () { return App.app.config.get("fpp"); }
	}

	// Start application
	static start (rootElement: HTMLElement) {
		Database.auth.checkAuth().then(result => {
			if (result) {
				// App.app.init();

				if (this.authCheckInterval) window.clearInterval(this.authCheckInterval);
				this.authCheckInterval = window.setInterval(Database.auth.checkAuth, 60 * 1000);
			}

			this.performRedirect();

			ReactDOM.render(<App />, rootElement);
		});
	}

	private static performRedirect () {
		if (LocationManager.currentLocation.length <= 1) {
			LocationManager.updateLocation("/folders/");
		}
	}


	config: Config
	snackbar: any
	// TODO mdc typings

	// Current page data
	/*data = {
		_data: {
			albumId: -1,
			personId: -1,
			folderData: { folders: [], files: [] },
			loaded: {
				get all () { return this.albums && this.people && this.geotags; },
				albums: false,
				people: false,
				geotags: false
			}
		},

		viewName: "files",
		//view: new FilesView() as View,
		queryParams: new URLSearchParams(Platform.urls.getCurrentQuery()),

		get folderType () {
			let urlList = trimUrl(Platform.urls.getCurrentAddress()).split("/");
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
		get address (): string { return this.currentRootObject.path || this.currentRootObject.full_name || "/"; },
		get apiUrl () {
			if (this._data.albumId == -1 && this._data.personId == -1 && !Object.getOwnPropertyNames(this._data.folderData).length) return null;
			else return trimUrl(this.folderType + "/" + ifDefElse(this.currentRootObject.id, "")) + (this.queryParams.toString() ? ("?" + this.queryParams.toString()): "");
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

		get objectCount () { return App.app.els.filesCont.sortedFiles.length || App.app.els.filesCont.sortedFiles.length || 0; }
	}*/

	// Page elements
	/* els = {
		getElement<T extends HTMLElement> (selector: (string | HTMLElement), tagName: string): T {
			function check<U extends HTMLElement> (el: HTMLElement): el is U {
				return el.tagName == tagName;
			}

			var el: HTMLElement = $(selector).get(0);
			if (check<T>(el)) return el;
		},

		get addressBar (): AddressBar { return App.app.els.getElement<AddressBar>("#addressBar", "address-bar"); },
		get filesCont (): FilesContainer { return App.app.els.getElement<FilesContainer>("#filesContainer", "files-container"); },
		get filesMap (): GMapView { return App.app.els.getElement<GMapView>("#filesMap", "map-view"); },
		get filterBar (): FilterBar { return App.app.els.getElement<FilterBar>("#filterBar", "filter-bar"); },
		get imageModal (): ImageModal { return App.app.els.getElement<ImageModal>("#imageModal", "image-modal"); },
		get navDrawer (): NavDrawer { return App.app.els.getElement<NavDrawer>("#navigationDrawer", "nav-drawer"); },
		get sortBar (): SortBar { return App.app.els.getElement<SortBar>("#sortBar", "sort-bar"); },
		get toolBar (): ToolBar { return App.app.els.getElement<ToolBar>("#toolBar", "tool-bar"); }
	} */

	constructor (props) {
		super(props);

		App.app = this;

		// Notification snackbar
		//this.snackbar = new mdc.snackbar.MDCSnackbar($("#snackbar").get(0));
	}

	render () {
		return <BrowserRouter>
			<MuiThemeProvider theme={ App.theme }>
				<CssBaseline />

				<Route path="" render={ (props) => (
					<LocationManager history={ props.history }>
						<Route path="/login" component={ LoginPage } />

						<Route path="/folders/" render={ () => <MainPage location={ props.location } /> }></Route>
						{/* TODO investigate bug with not accepting string[] to path */}
					</LocationManager>
				) } />
			</MuiThemeProvider>
		</BrowserRouter>;
	}

	/*init () {
		console.log("app inited");
		return;

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
			window.location.href = Platform.urls.getPageUrl("login");
		});
	}

	logOut () {
		window.localStorage.removeItem("jwtToken");
		window.sessionStorage.removeItem("jwtToken");
		window.location.href = Platform.urls.getPageUrl("login");
	}

	refreshConfig () {
		let _this = this;
		return new Promise(function (resolve, reject) {
			apiRequest("membership/config/").then(function (data) {
				_this.config = new Config(data);

				_this.els.sortBar.init();
				_this.els.sortBar.refresh();

				//TODO add min/max/etc. to the API request maybe

				resolve();
			});
		});
	}

	refreshGeneralData () {
		let _this = this;

		apiRequest("albums/").then(function (data) {
			Album.albums = Album.createFromList(data);
			_this.els.navDrawer.refreshAlbums();

			_this.data._data.loaded.albums = true;
			if (_this.data._data.loaded.all) _this.onLoadedMetadata();
		});

		apiRequest("people-groups/").then(function (data) {
			PersonGroup.groups = PersonGroup.createFromList(data);
			_this.els.navDrawer.refreshPeople();

			if (_this.data.folderType == "people-root") {
				_this.refreshPeople();
			}

			_this.data._data.loaded.people = true;
			if (_this.data._data.loaded.all) _this.onLoadedMetadata();
		});

		apiRequest("geotag-areas/").then(function (data) {
			GeoTagArea.areas = GeoTagArea.createFromList(data);
			_this.els.navDrawer.refreshGeoTagAreas();

			_this.data._data.loaded.geotags = true;
			if (_this.data._data.loaded.all) _this.onLoadedMetadata();
		});
	}

	onLoadedMetadata () {
		this.els.filterBar.refresh();
		this.refreshFilesData(null, null, null, "initial");
	}

	// Refresh the page URL
	refreshFilesData (displayUrl: string, apiUrl?: string, queryParams?: { removeOld?: boolean, "search": string }, linkType?: string) {
		$("#files .mdc-linear-progress").css("display", "");

		apiUrl = trimUrl(displayUrl ? apiUrl : (this.data.apiUrl || ""));
		displayUrl = trimUrl(displayUrl || Platform.urls.getCurrentAddress() + Platform.urls.getCurrentQuery());
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
		this.els.sortBar.refreshViewSwitcher();

		this.els.addressBar.refreshUrls(linkType);
		window.history.pushState("", "", Platform.urls.getDisplayUrl(displayUrl));

		if (apiUrl == "people/") {
			if (this.data._data.loaded.people) this.refreshPeople();
			return;
		}

		$("#files > *:not(.mdc-linear-progress)").css("display", "none");

		let parent = this;
		apiRequest(apiUrl).then(function (data) {
			parent.data.view.refresh(data);
			this.els.addressBar.refresh();
		});
	}

	refreshPage (fpp, page): void {
		if (page !== null) this.data.queryParams.set("page", page);
		if (fpp !== null) this.data.queryParams.set("fpp", fpp);
		this.clearDefaultQueryParams();

		window.history.pushState("", "", "/fileserver" + Platform.urls.getCurrentAddress() + (this.data.queryParams.toString() ? ("?" + this.data.queryParams.toString()) : ""));

		this.data.view.refreshPage(fpp, page);
	}

	fetchPageFiles () {
		let page = this.getQueryParam("page");
		let parent = this;
		if (this.data.view.checkRange(this.getQueryParam("fpp") * (page - 1), this.getQueryParam("fpp") * page)) {
			let addFiles = function (data) { parent.data.view.addFiles(data); };
			if (page > 1 && !this.data.view.checkRange(this.getQueryParam("fpp") * (page - 2), this.getQueryParam("fpp") * (page - 1))) apiRequest(getUrl(addToUrl(this.data.apiUrl, App.app.data.objectType + "/"), true, { page: page - 1 })).then(addFiles);
			if (page < Math.ceil(this.data.objectCount / this.getQueryParam("fpp")) && !this.data.view.checkRange(this.getQueryParam("fpp") * (page + 1), this.getQueryParam("fpp") * (page + 2))) apiRequest(getUrl(addToUrl(this.data.apiUrl, App.app.data.objectType + "/"), true, { page: page + 1 })).then(addFiles);
		} else {
			apiRequest(addToUrl(this.data.apiUrl, App.app.data.objectType + "/")).then(function (data) {
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
		} else this.data._data.folderData = { folders: [], files: [] };
	}

	refreshPeople () {
		this.els.filesCont.refreshGroups(PersonGroup.groups);

		$("#files .mdc-linear-progress").css("display", "none");
	}

	setView (view, noRefresh) {
		this.data.viewName = view;

		if (view == "files") {
			this.data.view = new FilesView();
		} else if (view == "map") {
			this.data.view = new MapView();
		}

		if (!noRefresh) this.refreshFilesData(Platform.urls.getCurrentAddress() + "?view=" + view);
	}

	clearDefaultQueryParams () {
		if (!this.data.queryParams.get("fpp")) this.data.queryParams.set("fpp", App.queryParamDefaults.fpp);

		for (var key in App.queryParamDefaults) {
			if (this.data.queryParams.get(key) == App.queryParamDefaults[key] && App.queryParamDefaults.toClear(key)) this.data.queryParams.delete(key);
		}
	}

	getQueryParam (key) {
		let value = this.data.queryParams.get(key) || App.queryParamDefaults[key] || null;
		if (value == "true") value = true;
		else if (value == "false") value = false;
		else if (!isNaN(parseFloat(value))) value = parseFloat(value);

		return value;
	}

	dismissSnackbar () {
		this.snackbar.foundation_.active_ = false;
		this.snackbar.foundation_.queue_ = [];
		$(this.snackbar.root_).removeClass("mdc-snackbar--active");
	}*/
}
