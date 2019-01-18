# Remote Photo Management System

This project is a work in progress. It's not quite ready for any practical use yet.

It has three main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

See also the [Server](https://github.com/zsmith3/Photo-Manager-Server/) repository for the Django-based server-side code. The client does not yet function without a server to connect to.


## Installation

1) Install NPM
2) Clone this repository (`git clone https://github.com/zsmith3/Photo-Manager-Fileserver/`) and enter the directory (`cd Photo-Manager-Fileserver`)
3) Install NPM dependencies (`npm install`)
4) In order to build:
	- Install Parcel Bundler globally (`npm install -g parcel-bundler`)
	- Install [Powershell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell?view=powershell-6)


## Building

The script *./build.ps1* can be used to build, with the following parameters:
- `platform` - The platform to build for - `"browser"` or `"cordova"`
- `server` - The back-end server URL to connect to
- `out` - The directory to output to
- `prod` - If true, build in production mode. If false, build for development.

Example:

`powershell ./build.ps1 -platform "browser" -server "http://localhost/fileserver/" -out "dist" -prod $false`

These are the default parameter values, so this command is equivalent to just running: `powershell ./build.ps1`.

Note that when environment variables are changed (i.e. `platform` or `server`), you may need to clear the **.cache** directory for changes to be registered.


## Features

TODO


## Contributing

Any contribution would be welcomed and greatly appreciated, even if just in the form of suggestions/bug reports.
