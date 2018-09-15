// Platform-specific versions of functions
var Platform = {
	getImgSrc: function (object, size) {
		switch (object.type) {
		case "file":
			return mediaRequest("api/images/" + object.id + size);
		case "face":
			return mediaRequest("api/images/faces/" + object.id + size);
		}
	}
};
