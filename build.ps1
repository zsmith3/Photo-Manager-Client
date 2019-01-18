param([string]$platform="browser", [string]$server="http://localhost/fileserver/", [string]$out="dist", [bool]$prod=$false)

# Setup environment variables for Parcel
$env:BUILD_PLATFORM=$platform
$env:SERVER_URL=$server

$entryPoint = "src/index.html"

# Run parcel
if ($prod) { parcel build $entryPoint --out-dir $out }
else { parcel $entryPoint --out-dir $out }
