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
			pageLoader.refreshFilesData("folders/" + this.path.replace("&", "%26") + getCurrentQuery(), "folders/" + this.id + "/" + getCurrentQuery());
			// TODO more general approach to URL encoding
		}
	}

	getSrc (index) {
		// TODO remove this (and all uses)
		if (index in this.data) {
			return this.data[index];
		} else {
			return serverUrl + "api/images/" + this.id + ImageLoader.imgSizes[index];
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

	set starred (value) {
		let parent = this;
		apiRequest("files/" + this.id + "/", "PATCH", {is_starred: value}).then(function () {
			parent.is_starred = value;
			pageLoader.filesContainer.getFilebox(parent.id).showIcons();
		});
	}

	get deleted () { return this.is_deleted; }

	set deleted (value) {
		let parent = this;
		apiRequest("files/" + this.id + "/", "PATCH", {is_deleted: value}).then(function () {
			parent.is_deleted = value;
			pageLoader.filesContainer.getFilebox(parent.id).showIcons();
		});
	}

	/* generateFilebox () {
		//TODO this (alongside python?)
	}

	getThumbnail () {
		//simple on web, but includes getimagesrc on native
	} */
}

// Create a list of Files from a list of objects
FileObject.createFromList = function (list) {
	files = {};
	for (i in list) files[list[i].id] = new FileObject(list[i]);
	return files;
};
