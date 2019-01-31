module.exports = {
	browser: {
		server: "https://localhost/fileserver/",
		outDir: "dist",
		publicUrl: "/",
		preScript: false,
		serveType: "serve"
	},
	cordova: {
		server: "https://localhost/fileserver/",
		outDir: "cordova/www",
		publicUrl: "./",
		preScript: false,
		serveType: "watch"
	}
};
