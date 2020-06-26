# Remote Photo Management System

[![Build Status](https://travis-ci.com/zsmith3/Photo-Manager-Client.svg?branch=master)](https://travis-ci.com/zsmith3/Photo-Manager-Client)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

This project is a work in progress. It's not quite ready for any practical use yet. See [here](https://zsmith3.github.io/Photo-Manager-Client/demo/) for an up-to-date public demo.

It has three main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

See also [Photo-Manager-Server](https://github.com/zsmith3/Photo-Manager-Server/) for the Django-based server-side code. This client does not yet function without a server to connect to.


## Installation

1) Install [NPM](https://nodejs.org/en/)
2) Clone this repository (`git clone https://github.com/zsmith3/Photo-Manager-Client/`) and enter the directory (`cd Photo-Manager-Client`)
3) Install NPM dependencies (`npm install`)
4) Get a Google Maps Javascript API Key (see [here](https://developers.google.com/maps/documentation/javascript/get-api-key)) and add it to the *./build_config.js* file.
5) For Cordova:
	- Install Cordova globally (`npm install -g cordova`)
	- Enter the cordova directory (`cd cordova`) and run `mkdir www` then `cordova prepare` to install required platforms/plugins
	- To generate icons/splash screen:
		- Install [ImageMagick](https://www.imagemagick.org/script/download.php) (including legacy tools)
		- Install [cordova-splash](https://github.com/AlexDisler/cordova-splash) and [cordova-icon](https://github.com/AlexDisler/cordova-icon) (`npm install -g cordova-icon cordova-splash`)
		- Run (from cordova directory) `cordova-icon` and `cordova-splash`
	- Install external requirements to build to certain platforms (e.g. see [here](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#installing-the-requirements) for Android)


## Building

`npm run build` can be used to build the client, with various options:
- `platform` (required) - The platform to build for (`"browser"` or `"cordova"`)
- `buildType` (required) - The build environment (`"production"` or `"development"`)
- `server` - The back-end server URL to connect to (should end in `"/"`)
- `outDir` - The local directory to output build to
- `publicUrl` - The (relative) public URL at which files will be hosted
- `preScript` - The local path to an HTML file, containing any additional content which should be injected into the output `index.html` (before other scripts)

The default values for non-required options can be found (and edited) in *./build_config.js*. This is a user-specific file, the defaults for which are found in *./scripts/default_build_config.js*. Since named arguments are not yet supported, all options must be given in order, and `null` can be used as a placeholder to skip unwanted arguments.

Example Usage:

`npm run build browser development`

`npm run build browser production https:localhost/fileserver/ null null extra-script.html`

In order to build/run Cordova, you will then need to `cd cordova` and run [the relevant Cordova build command](https://cordova.apache.org/docs/en/latest/guide/cli/#build-the-app).


## Features/To-Do

Here is a list of existing features, as well as features which I intend to add in the future. This list may not be comprehensive.

- [x] Sorting capabilities
	- [x] Albums
		- [x] Albums can have (infinitely recursive) child albums
			- [x] Files added to child albums are automatically included in parent albums
		- [x] Files can be added to (multiple) albums
	- [x] People
		- [x] New files are scanned for contained faces
		- [x] Faces can be manually identified as belonging to certain people
		- [x] Predictions for people to which faces belong
			- [ ] Run this automatically
			- [x] Users can confirm predictions
		- [ ] Allow undetected faces to be added manually
	- [x] Geotags
		- [x] Geotags are read from EXIF data
		- [x] Files can be given a geotag, which includes co-ordinates, and an "area"
		- [x] Geotag areas include a name, address, co-ordinates and area radius
	- [x] Scanned photos can be added, cropped automatically and saved to main folder
	- [ ] Feature tags
- [x] Page components
	- [x] Navigation drawer
		- [x] Links to scanned photos
		- [x] Lists albums
			- [x] Shows a hierarchical list, with collapsible lists of child albums
			- [x] Albums can be renamed, moved to different parents and removed
			- [x] New albums can be added as child or root albums
		- [x] Lists people
			- [x] Shows a list of person groups, each with a collapsible list of people
			- [x] Groups can be created, renamed and removed
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
			- [x] Option to show all files in subfolders, rather than just immediate children
		- [x] People
			- [x] Displays faces for different people
			- [ ] Optionally show files belonging to a person
		- [x] Albums
			- [x] Displays all files in an album and its children
			- [ ] List child albums
	- [x] Separate view for scanned photos
		- [x] Editor with cropping function
	- [x] Filtering
		- [x] Searching
			- [x] Files
				- [x] Found using file name, and names of related people, geotags, albums and folders
			- [x] Folders
				- [x] Found using folder name
				- [ ] Find using name of any parent folder
			- [ ] Allow searching of faces (via their file)
			- [x] Can search search only immediate children, or optionally all subfolder contents
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
