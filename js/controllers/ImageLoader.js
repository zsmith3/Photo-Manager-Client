// Class for loading images
class ImageLoader {
	constructor (image, object, maxState, onload, manual) {
		this.image = image;

		this.onImageLoad = onload;

		if (object) this.update(object, maxState, manual);
		else this.maxStateParam = maxState;
	}

	// Update the ImageLoader with a new file
	update (object, maxState, manual) {
		this.setObject(object);

		this.setStates(maxState || this.maxStateParam);

		this.currentState = this.minState;

		if (!manual) this.loadImage();
	}

	// Set the object property
	setObject (object) {
		switch (object.constructor) {
		case FileObject:
			this.object = {id: object.id, type: "file", file: object};
			break;
		case Face:
			this.object = {id: object.id, type: "face", file: object};
			break;
		default:
			this.object = object;
			this.object.file = {data: {}};
			break;
		}
	}

	// Set the maxState and minState properties
	setStates (maxState) {
		this.maxStateParam = maxState;

		if (maxState && typeof maxState == "object" && "min" in maxState && "max" in maxState) {
			this.minState = maxState.min - 1;
			this.maxState = maxState.max;
		} else  {
			if (typeof maxState == "number") this.maxState = maxState;
			else this.maxState = this.getSizes().length - 1;

			if (this.object.type == "face") this.minState = this.maxState - 1;
			else this.minState = -1;
		}
	}

	// Load an image
	loadImage () {
		var _this = this;

		if (this.currentState >= 0 && !(this.currentState in this.object.file.data)) {
			let rotations = {3: 180, 6: 90, 8: -90};
			if (this.getSizes()[this.currentState] == "/" && this.object.file.orientation in rotations) {
				let data = getRotatedImage(this.image, rotations[this.object.file.orientation]);
				this.image.src = data;
				this.object.file.data[this.currentState] = data;
			}
		}

		if (this.currentState >= this.maxState) return;

		if (!this.image.onload) {
			this.image.onload = function () {
				if (_this.onImageLoad) _this.onImageLoad();
				_this.loadImage();
			};
			this.image.onerror = function () { _this.loadImage(); };
		}

		for (var i = this.maxState; i > this.currentState; i--) {
			if (i in this.object.file.data) {
				$(this.image).attr("src", this.object.file.data[i]);
				this.currentState = i;
				return;
			}
		}

		this.currentState += 1;

		let currentId = this.object.id;

		Platform.getImgSrc(this.object, this.getSizes()[this.currentState]).then(function (url) {
			if (_this.object.id != currentId) return;

			$(_this.image).attr("src", url);
			_this.object.file.data[_this.currentState] = url;
		}).catch(function () { _this.loadImage(); });
	}

	getSizes () {
		switch (this.object.type) {
		case "file":
			return ImageLoader.imgSizes;
		case "face":
			return ImageLoader.faceSizes;
		}
	}
}

ImageLoader.imgSizes = ["/thumbnail/", "/300x200/", "/1800x1200/", "/"];
ImageLoader.faceSizes = ["/30/", "/200/", "/300/"];
