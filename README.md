# Remote Photo Management System - Web Branch

This branch contains code to be hosted on a website (usually the same as the API server, but not necessarily). For details about the project and its features, see the master branch README.

## Hosting

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
