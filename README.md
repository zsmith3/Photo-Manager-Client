# Remote Photo Management System

[![Build Status](https://travis-ci.com/zsmith3/Photo-Manager-Client.svg?branch=master)](https://travis-ci.com/zsmith3/Photo-Manager-Client)

This project is a work in progress. It's not quite ready for any practical use yet.

It has three main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

See also [Photo-Manager-Server](https://github.com/zsmith3/Photo-Manager-Server/) for the Django-based server-side code. This client does not yet function without a server to connect to.


## Installation

1) Install NPM
2) Clone this repository (`git clone https://github.com/zsmith3/Photo-Manager-Client/`) and enter the directory (`cd Photo-Manager-Client`)
3) Install NPM dependencies (`npm install`)
4) In order to build:
	- Install Parcel Bundler globally (`npm install -g parcel-bundler`)
	- Install [Powershell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell?view=powershell-6)
5) Cordova:
	- Install Cordova globally (`npm install -g cordova`)
	- Enter the cordova directory (`cd cordova`) and run `cordova prepare` to install required platforms/plugins
	- Install external requirements to build to certain platforms (e.g. see [here](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#installing-the-requirements) for Android)


## Building

### Browser

Use *./build_browser.ps1* to build for web browser, with the following parameters:
- `server` (required) - The back-end server URL to connect to
- `outDir` - The directory to output to
- `publicUrl` - The (relative) public URL at which files will be hosted - e.g. */fileserver/*
- `parcelMode` - (Development mode only) If set to `serve`, Parcer server will be started. If set to `watch`, no server will be launched.
- `prod` - If true, build in production mode. If false, build for development.

Example (using default parameter values, except for `server`):

`powershell ./build_browser.ps1 -server "http://localhost/fileserver/" -outDir "dist" -publicUrl "/" -parcelMode "serve" -prod $false`

### Cordova

Use *./build_cordova.ps1* to build source files to `cordova/www`, with the following parameters:
- `server` (required) - The back-end server URL to connect to (note that `localhost` won't work, as this will connect to the IP of the phone/emulator)
- `prod` - If true, build in production mode. If false, build for development.

Example (again `prod` defaults to `$false`):

`powershell ./build_cordova.ps1 -server "http://localhost/fileserver/" -prod $false`

Then `cd cordova` and `cordova emulate android` (or other platform as required).


## Features/To-Do

Here is a list of existing features, as well as features which I intend to add in the future. This list may not be comprehensive.

- [x] Sorting capabilities
	- [ ] Albums
		- [x] Albums can have (infinitely recursive) child albums
			- [x] Files added to child albums are automatically included in parent albums
		- [x] Files can be added to (multiple) albums
	- [x] People
		- [x] New files are scanned for contained faces
		- [x] Faces can be manually identified as belonging to certain people
		- [x] Predictions for people to which faces belong
			- [ ] Run this automatically
			- [x] Users can confirm predictions
			- [ ] Allow users to reject predictions
	- [ ] Geotags
		- [x] Geotags are read from EXIF data
		- [ ] Files should have a geotag, which includes co-ordinates, and an "area"
		- [ ] Geotag areas should include a name, address, co-ordinates and area radius
	- [ ] Feature tags
- [x] Page components
	- [x] Navigation drawer
		- [ ] Lists albums
			- [x] Shows a hierarchical list, with collapsible lists of child albums
			- [x] Albums can be renamed, moved to different parents and removed
			- [x] New albums can be added as child or root albums
		- [x] Lists people
			- [x] Shows a list of person groups, each with a collapsible list of people
			- [x] Groups can be created renamed and removed
			- [x] People can be created within a group, renamed, moved to a different group and removed
			- [x] People can be opened
		- [ ] List geotag areas
		- [x] Persistent on large screens, temporary on small screens
	- [x] Address bar
		- [x] Shows current folder/person/album path
		- [x] Has back, forward, "up" and "home" (root folders) buttons
		- [x] Contains a search bar
	- [x] Main files container
		- [x] Items can be selected and modified (see Sorting capabilities)
		- [ ] Show details for selected items
		- [ ] Different views
			- [ ] Map view
			- [ ] Option to show files containing person or faces within folder
	- [x] Open file
		- [x] Image files can be displayed full screen
			- [x] Images can be panned and zoomed
			- [x] Users can move forwards and backwards through a list of images
			- [ ] Display outlines of faces in images
			- [ ] Show options menu for open images
		- [ ] Allow other file types to be opened
- [x] Navigation
	- [x] 3 main hiearachies
		- [x] Folders
			- [x] Displays folders and files in separate lists
			- [ ] Option to show all files in subfolders, rather than just immediate children
		- [x] People
			- [x] Displays faces for different people
			- [ ] Optionally show files belonging to a person
		- [ ] Albums
	- [x] Filtering
		- [x] Searching
			- [x] Files
				- [x] Found using file name, and names of related people, geotags, albums and folders
			- [x] Folders
				- [x] Found using folder name
				- [ ] Find using name of any parent folder
			- [ ] Allow searching of faces (via their file)
			- [x] Searching within a folder returns results from all subfolders
				- [ ] Option to choose whether or not to search all subfolders
		- [ ] (*possibly*) More explicit filtering system
- [x] Cross-platform
	- [x] Web
	- [x] Mobile application
		- [x] Use Cordova to package for mobile
		- [ ] Use React-Native to build native application
	- [ ] Desktop application
		- [ ] Use Electron to package for desktop
		- [ ] (*possibly*) Use Proton-Native to build native application
	- [ ] Local (mobile and desktop) features
		- [ ] Synchronise files to display images faster
		- [ ] Synchronise full database to allow offline usage
		- [ ] Allow fully local usage with local-only files


## Contributing

Any contribution would be welcomed and greatly appreciated, even if just in the form of suggestions/bug reports.
