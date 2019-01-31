// Modules
const Bundler = require("parcel-bundler");
const Path = require("path");
const fs = require("fs");

// Local config
const allConfig = require(Path.join(__dirname, "../build_config"));

// Extract script args
const argNames = ["platform", "buildType", "server", "outDir", "publicUrl", "preScript", "serveType"];
const args = {};
for (let i = 0; i < argNames.length; i++) {
	if (i >= process.argv.length - 2) args[argNames[i]] = null;
	else {
		let arg = process.argv[i + 2];
		args[argNames[i]] = arg === "null" ? null : arg;
	}
}

// Single entrypoint file location
const entryFile = Path.join(__dirname, "../src/index.html");

// Require build platform
if (args.platform === null) throw "No platform specified.";
if (args.buildType === null) throw "No build type specified.";

// Set platform config from args
const config = allConfig[args.platform];
for (let key in args) if (args[key] !== null) config[key] = args[key];

// Set env vars
process.env.BUILD_PLATFORM = args.platform;
process.env.NODE_ENV = args.buildType;
process.env.SERVER_URL = config.server;
process.env.HOST_URL = config.publicUrl;

// Bundler options
const options = {
	outDir: config.outDir,
	publicUrl: config.publicUrl,
	hmr: false
};

// Function to remove a full directory structure
function removeFullDir(path) {
	fs.readdirSync(path).forEach(file => {
		let filePath = Path.join(path, file);
		if (fs.lstatSync(filePath).isDirectory()) removeFullDir(filePath);
		else fs.unlinkSync(filePath);
	});
	fs.rmdirSync(path);
}

// Run bundler
(async () => {
	// Clear cache
	const cachePath = Path.join(__dirname, "../.cache");
	if (fs.existsSync(cachePath)) removeFullDir(cachePath);

	const bundler = new Bundler(entryFile, options);

	bundler.on("buildEnd", () => {
		// Write additional pre-script content
		if (config.preScript) {
			console.log("Writing pre-script content...");
			const preScriptBuffer = fs.readFileSync(config.preScript);
			const preScripthtml = preScriptBuffer.toString();
			const bundlePath = Path.join(config.outDir, "index.html");
			const bundleBuffer = fs.readFileSync(bundlePath);
			const bundleHtml = bundleBuffer.toString();
			const newHtml = bundleHtml.replace('<div id="pre-script"></div>', preScripthtml);
			fs.writeFileSync(bundlePath, newHtml);
		}
	});

	console.log("Starting parcel...");

	if (args.buildType === "development" && config.serveType === "serve") await bundler.serve();
	else await bundler.bundle();
})();
