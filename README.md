# Remote Photo Management System

This project is a work in progress. It's probably not ready for any practical use yet.

It has two main goals:
- To provide a powerful photo management system (like, for example, Picasa)
- To allow for connection to a self-hosted file server
- To be open source

Example use case: I want to be able to remotely synchronise the photos on my phone and my computer, and organise them on either one. But, I don't want the cost/privacy issues of uploading to a third-party site.

## Branches

- **Master**: shared client-side code
- **Web**: main web client
- **Cordova**: Cordova-based mobile client
- **Electron**: Electron-based desktop client
- **Server**: Django-based API

## Installation

This project does not yet exist in an easy-to-install format. There are some relevant instructions here for each platform, but it's quite involved, and may not work yet. If you are interested in actually using it then contact me and I'll work on this.

### Web Client

It should be possible to host these static files with any HTTPS web server. If you want to host the API on the same server, it will also need to support WSGI (see the server branch README for more on this).
I use [Apache](https://httpd.apache.org/), and recommend [using](https://httpd.apache.org/docs/2.4/ssl/ssl_howto.html) and [forcing](https://wiki.apache.org/httpd/RewriteHTTPToHTTPS) HTTPS.

I also use the following config (All of this goes within a VirtualHost in httpd-ssl.conf):

```
# To insert /index.html
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.+)$ $1\/index.html [L]

# Redirect away from django
AliasMatch ^((?!admin|static|api|cgi).)*$ /path/to/this/branch/$0

# To externally redirect /dir/foo.html to /dir/foo
RewriteCond %{THE_REQUEST} ^[A-Z]{3,}\s([^.]+)\.html [NC]
RewriteRule ^ %1 [R=301,L]

# To internally forward /dir/foo to /dir/foo.html
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME}.html -f
RewriteRule ^(.*?)/?$ $1.html [L]

# To remove unnecessary double slashes
RewriteCond %{REQUEST_URI} ^(.*?)(/{2,})(.*)$
RewriteRule . %1/%3 [R=301,L]

# To handle index.html special URLs
RewriteCond %{REQUEST_URI} ^\/fileserver\/(folders|albums|people)\/(.*)$ [OR]
RewriteCond %{REQUEST_URI} ^\/fileserver\/(folders|albums|people)$
RewriteRule ^\/fileserver\/(.*)$ /fileserver/index.html [L]
```

### Desktop (Electron) Client

NOTE: this has not been tested in its current state - there is no guarantee these instructions will work.

1) Install [Electron](https://electronjs.org/)
2) Clone the **electron** branch, then enter the folder and run `electron .` to test the application

TODO: put instructions on building the application here

### Mobile (Cordova) Client

NOTE: this has not been tested in its current state - there is no guarantee these instructions will work.

1) Install [Cordova](https://cordova.apache.org/) and follow their instructions to create a new app
2) Paste all of the files in the **cordova** branch into the `www` folder of the new app
3) Build/run the app

### Server

NOTE: these instructions haven't been tested and are probably missing something.

1) Install:
	- [Django](https://www.djangoproject.com/)
	- [Django Rest Framework](http://www.django-rest-framework.org/)
		- [JSON WebToken Authentication for DRF](http://getblimp.github.io/django-rest-framework-jwt/)
		- [MessagePack for DRF](https://github.com/juanriaza/django-rest-framework-msgpack)
		- [QueryFields for DRF](https://github.com/wimglenn/djangorestframework-queryfields)
		- [Nested Routers for DRF](https://github.com/alanjds/drf-nested-routers)
		- [Extra Fields for DRF](https://github.com/Hipo/drf-extra-fields)
	- [User Agents](https://github.com/selwin/python-user-agents)
	- [OpenCV-Python](https://pypi.org/project/opencv-python/)
	- [OpenCV-Contrib-Python](https://pypi.org/project/opencv-contrib-python/)
	- [Pillow](https://python-pillow.org/) or [Pillow-SIMD](https://github.com/uploadcare/pillow-simd)
	- [ExifRead](https://pypi.org/project/ExifRead/)
	- [Mutagen](https://github.com/quodlibet/mutagen)
	- [Numpy](http://www.numpy.org/)
	- [Piexif](https://pypi.org/project/piexif/)
2) Create a new project and add the following settings:
	```python
	INSTALLED_APPS = [
		"fileserver.apps.FileserverConfig",
		"rest_framework",
		"rest_framework.authtoken",
		...
	]

	REST_FRAMEWORK = {
		"DEFAULT_RENDERER_CLASSES": (
			"rest_framework.renderers.JSONRenderer",
			"rest_framework_msgpack.renderers.MessagePackRenderer",
			"rest_framework.renderers.BrowsableAPIRenderer"
		),
		"DEFAULT_PARSER_CLASSES": (
			"rest_framework.parsers.JSONParser",
			"rest_framework_msgpack.parsers.MessagePackParser"
		),
		"DEFAULT_AUTHENTICATION_CLASSES": (
			"rest_framework_jwt.authentication.JSONWebTokenAuthentication"
		)
	}

	JWT_AUTH = {
		"JWT_EXPIRATION_DELTA": datetime.timedelta(365)
	}
	```
3) Create a new app (e.g. "fileserver") and paste all files from this branch into the new app
4) Add fileserver.urls to the main project urls file
5) If also hosting the web client, add Django to the static server through WSGI (see [here](https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/modwsgi/) for Apache instructions)

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
