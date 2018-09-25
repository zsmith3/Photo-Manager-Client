// File class
class FileObject {
	// Construct File from object
	constructor (object) {
		for (var property in object) this[property] = object[property];

		if (this.geotag) this.geotag = new GeoTag(this.geotag);

		if (this.orientation == 6 || this.orientation == 8) {
			let width = this.width;
			this.width = this.height;
			this.height = width;
		}

		this.data = {};
		this.zoom = {};
	}

	open () {
		if (this.type == "image") {
			$("image-modal").get(0).openFile(this);
		} else if (this.type == "folder") {
			//pageLoader.refreshFilesData("folders/" + this.path.replace("&", "%26"), "folders/" + this.id);
			pageLoader.refreshFilesData("folders/" + this.path.replace("&", "%26") + Platform.urls.getCurrentQuery(), "folders/" + this.id + "/" + Platform.urls.getCurrentQuery());
			// TODO more general approach to URL encoding
		}
	}

	getSrc (index) {
		// TODO remove this (and all uses)
		if (index in this.data) {
			return this.data[index];
		} else {
			return Platform.urls.serverUrl + "api/images/" + this.id + ImageLoader.imgSizes[index];
		}
	}

	getSize (maxW, maxH) {
		if (this.width / this.height < maxW / maxH) {
			return [this.width * maxH / this.height, maxH];
		} else {
			return [maxW, this.height * maxW / this.width];
		}
	}

	get starred () { return this.is_starred; }

	get deleted () { return this.is_deleted; }

	// Function to set a boolean field (for private use)
	_setBool (type, value) {
		let _this = this;
		return new Promise(function (resolve, reject) {
			Database.update("files", _this.id, { [type]: value }).then(function () {
				_this[type] = value;
				pageLoader.filesContainer.getFilebox(_this.id).showIcons();
				resolve();
			}).catch(reject);
		});
	}

	// Wrappers for _setBool

	star () { return this._setBool("is_starred", true); }

	unstar () { return this._setBool("is_starred", false); }

	markDelete () { return this._setBool("is_deleted", true); }

	unmarkDelete () { return this._setBool("is_deleted", false); }
}

// Create a list of Files from a list of objects
FileObject.createFromList = function (list) {
	files = {};
	for (i in list) files[list[i].id] = new FileObject(list[i]);
	return files;
};
