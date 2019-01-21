# Params
param([string]$server, [bool]$prod=$false)

# Require server param
if (-not $server) { Throw "You must specify a server URL using -server" }

# Clear cache
if (Test-Path ".cache") { Remove-Item -Recurse ".cache" }

# Build variables
$entryPoint = "src/index.html"
$outDir = "cordova/www"
$publicUrl = "./"

# Setup environment variables for Parcel
$env:BUILD_PLATFORM = "cordova"
$env:SERVER_URL = $server

# Build
if ($prod) { parcel build $entryPoint --out-dir $outDir --public-url $publicUrl }
else { parcel watch $entryPoint --out-dir $outDir --public-url $publicUrl --no-hmr }
