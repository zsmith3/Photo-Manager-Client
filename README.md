# Remote Photo Management System

This project is a work in progress. It's probably not ready for any practical use yet.

It has two main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

## Branches

- **Master**: shared client-side code
	- Any modifications to shared code should be made to this branch and then merged into the others
- **Web**: main web client
- **Cordova**: Cordova-based mobile client
- **Electron**: Electron-based desktop client
- **Server**: Django-based API

## Installation

This project does not yet exist in an easy-to-install format. There are relevant installation instructions in each branch, but it's quite involved, and may not work yet. If you are interested in using this then contact me and I'll work on this.

## Features

This is a list of all of the existing features, as well as some that I want to add.

- TODO add existing features here
- [ ] JS Database class
	- Should handle all interactions with the "database"
    - On the web, this will be all API calls
	- On other platforms it can be substituted for a local database
	- Contain common methods, etc.
	- Potentially a django-esque "models" system
	- Add snackbar notifications for all database changes (i.e. "saving" and "saved")

## Contributing

Any contribution is welcomed and greatly appreciated, even if just in the form of suggestions/bug reports. See the list above for features to be added, and contact me to co-ordinate work.
