# Params
param([string]$server, [string]$outDir="dist", [string]$publicUrl="/", $parcelMode="serve", [bool]$prod=$false)

# Require server param
if (-not $server) { Throw "You must specify a server URL using -server" }

# Clear cache
if (Test-Path ".cache") { Remove-Item -Recurse ".cache" }

# Build entry point
$entryPoint = "src/index.html"

# Setup environment variables for Parcel
$env:BUILD_PLATFORM = "browser"
$env:SERVER_URL = $server
$env:HOST_URL = $publicUrl

# Build
if ($prod) { parcel build $entryPoint --out-dir $outDir --public-url $publicUrl }
else { parcel $parcelMode $entryPoint --out-dir $outDir --public-url $publicUrl --no-hmr }
