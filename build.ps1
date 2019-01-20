param([string]$platform="browser", [string]$server="http://localhost/fileserver/", [string]$out=$false, [bool]$prod=$false)

# Set default output directory
if ($out -eq $false) {
	if ($platform -eq "cordova") { $out = "cordova/www" }
	else { $out = "dist" }
}

# Setup environment variables for Parcel
$env:BUILD_PLATFORM=$platform
$env:SERVER_URL=$server

$entryPoint = "src/index.html"

# Run parcel
if ($prod) { parcel build $entryPoint --out-dir $out }
else { parcel $entryPoint --out-dir $out }
