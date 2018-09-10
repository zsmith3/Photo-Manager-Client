# Remote Photo Management System

This project is a work in progress. It's probably not ready for any practical use yet.

It has two main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

## Branches

- web: main web client
- server: Django-based API
- cordova: Cordova-based mobile app
- electron: Electron-based desktop app

## Features

This is a list of all of the existing features, as well as some that I want to add.

- TODO add existing features
- [ ] JS Database class
	- Should handle all interactions with the "database"
    - On the web, this will be all API calls
	- On other platforms it can be substituted for a local database
	- Contain common methods, etc.
	- Potentially a django-esque "models" system
	- Add snackbar notifications for all database changes (i.e. "saving" and "saved")

## Contributing

Any contribution is welcomed and greatly appreciated, even if just in the form of suggestions/bug reports. See the list above for features to be added, and contact me to co-ordinate work.
