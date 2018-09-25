// Platform-specific versions of functions
var Platform = {
	urls: {
		serverUrl: "/fileserver/",

		getPageUrl: function (page, query) {
			if (page == "index") page = "";
			return "/fileserver/" + page + (query ? ("?" + query) : "");
		},

		getCurrentAddress: function () {
			return window.location.pathname.substr(11);
		},

		getCurrentQuery: function () {
			return window.location.search;
		},

		getDisplayUrl: function (url) {
			return "/fileserver/" + url;
		}
	},

	getImgSrc: function (object, size) {
		switch (object.type) {
		case "file":
			return mediaRequest("api/images/" + object.id + size);
		case "face":
			return mediaRequest("api/images/faces/" + object.id + size);
		}
	}
};
