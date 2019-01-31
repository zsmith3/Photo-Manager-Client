// Modules
const fs = require("fs");
const Path = require("path");

// Copy default build config file if needed
const src = Path.join(__dirname, "./default_build_config.js");
const dest = Path.join(__dirname, "../build_config.js");
if (!fs.existsSync(dest)) {
	fs.copyFileSync(src, dest);
	console.log("Copied default build config file.");
} else {
	console.log("Build config file already exists.");
}
