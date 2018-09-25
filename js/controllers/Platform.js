// Platform-specific functions
var Platform = {
	urls: {
		get serverUrl () { return window.localStorage.serverUrl; },

		getPageUrl (page, query) {
			return page + ".html" + (query ? ("?" + query) : "");
		},

		getCurrentAddress: function () {
			return new URLSearchParams(window.location.search).get("address") || "";
		},

		getCurrentQuery: function () {
			let params = new URLSearchParams(window.location.search);
			params.delete("address");
			return params.toString();
		},

		getDisplayUrl: function (url) {
			var query;
			if (url.indexOf("?") !== -1) {
				query = new URLSearchParams(url.substr(url.indexOf("?")));
				url = url.substr(0, url.indexOf("?"));
			} else query = new URLSearchParams();

			query.set("address", url);

			return "index.html?" + query.toString();
		}
	}

	// TODO other functions
};
