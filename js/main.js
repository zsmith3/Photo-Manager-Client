// Imports
const {app, BrowserWindow, ipcMain, dialog, Menu} = require("electron");
const path = require("path");
const url = require("url");

//const syncMod = require("./sync.js");
//const saveMetaMod = require("./save-meta.js");

// TODO have got about as far as trying to figure out how to deal with URLs


// Override error box function for debugging
dialog.showErrorBox = function (title, content) {
	console.log(title, ":", content);
};


// Globals
global.mainWindow;
global.extraWindows = {};

global.fullClose = false;
global.loggedIn = false;
global.userName;
global.menuTemplate = [
	{
		label: "File",
		submenu: [
			{
				label: "Not logged in",
			},
			{
				label: "Synchronise current folder",
				click: function () {
					mainWindow.webContents.executeJavaScript("openSyncFolder();");
				}
			},
			{
				label: "Settings",
				click: function () {
					if (extraWindows.settings.isVisible()) {
						extraWindows.settings.hide();
					} else {
						extraWindows.settings.show();
					}
				}
			},
			{
				label: "Log Out",
				click: function () {
					mainWindow.webContents.executeJavaScript("window.location = 'login.html?status=loggedout';");
				}
			},
			{
				label: "Exit",
				role: "quit"
			}
		]
	},
	{
		label: "View",
		submenu: [
			{
				label: "Browser Mode",
				click: function () {
					mainWindow.webContents.executeJavaScript("window.location = 'index.html' + window.location.search;");
				}
			},
			{
				label: "Gallery Mode",
				click: function () {
					mainWindow.webContents.executeJavaScript("window.location = 'gallery.html' + window.location.search;");
				}
			},
			{
				label: "View Synchronised Folders",
				click: function () {
					if (loggedIn) {
						mainWindow.loadURL(url.format({
							pathname: path.join(__dirname, "../sync.html"),
							protocol: "file:",
							slashes: true
						}));
					}
				}
			}
		]
	},
	{
		label: "Windows",
		submenu: [
			{
				label: "Toggle Syncs Window",
				click: function () {
					if (extraWindows.syncswin.isVisible()) {
						extraWindows.syncswin.hide();
					} else {
						extraWindows.syncswin.show();
					}
				}
			},
			{
				label: "Toggle Offline File Listings Window",
				click: function () {
					if (extraWindows.savemeta.isVisible()) {
						extraWindows.savemeta.hide();
					} else {
						extraWindows.savemeta.show();
					}
				}
			}
		]
	},
	{
		label: "Help",
		submenu: [
			{
				label: "Give Feedback",
				click: function () {
					if (extraWindows.feedback.isVisible()) {
						extraWindows.feedback.hide();
					} else {
						extraWindows.feedback.show();
					}
				}
			},
			{
				label: "Developer Tools",
				click: function () {
					mainWindow.openDevTools();
				}
			},
			{
				label: "About",
				click: function () {
					if (extraWindows.about.isVisible()) {
						extraWindows.about.hide();
					} else {
						extraWindows.about.show();
					}
				}
			}
		]
	}
];
global.extraWindowTemplates = [
	{name: "syncswin", options: {width: 600, height: 400, show: false}},
	{name: "savemeta", options: {width: 600, height: 400, show: false}},
	{name: "feedback", options: {width: 1200, height: 800, show: false}},
	{name: "settings", options: {width: 1000, height: 920, show: false}},
	{name: "about", options: {width: 600, height: 400, show: false}}
];


// Functions

// Create the main window and load welcome.html
function createWindow () {
	mainWindow = new BrowserWindow({width: 1600, height: 900});

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "../welcome.html"),
		protocol: "file:",
		slashes: true
	}));

	mainWindow.on("closed", () => {
		for (wName in extraWindows) {
			extraWindows[wName].webContents.executeJavaScript("endClose();").then(function (value) {
				extraWindows[value].close();
				extraWindows[value] = null;
			});
		}
		mainWindow = null;
	});
}

// Create an additional window
function createExtraWindow (name, options) {
	extraWindows[name] = new BrowserWindow(options);
	extraWindows[name].loadURL(url.format({
		pathname: path.join(__dirname, "../" + name + ".html"),
		protocol: "file:",
		slashes: true
	}));
}

// Create all additional windows
function createExtraWindows () {
	for (var i in extraWindowTemplates) {
		createExtraWindow(extraWindowTemplates[i].name, extraWindowTemplates[i].options);
	}
}

// Refresh the menu
function refreshMenu () {
	let menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
}


// App Events

app.on("ready", function () {
	refreshMenu();

	createWindow();
	createExtraWindows();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});


// IPC Events

ipcMain.on("start-sync", function () {
	syncMod.run();
	setInterval(function () { syncMod.run(); }, 30 * 60 * 1000);
});

ipcMain.on("run-sync", function (event, arg) {
	if (arg == "all") {
		syncMod.run();
	} else {
		syncMod.runPair(arg);
	}
});

ipcMain.on("save-meta", function () {
	saveMetaMod.run();
});

ipcMain.on("hide-window", function (event, arg) {
	extraWindows[arg].hide();
});

ipcMain.on("logged-in", function (event, user) {
	loggedIn = true;
	userName = user;

	menuTemplate[0].submenu[0].label = "Logged in as: " + user;
	refreshMenu();
});
