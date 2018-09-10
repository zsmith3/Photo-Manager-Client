// Class for loading images
class ImageLoader extends HTMLElement {
	constructor () {
		super();

		this.imageState = -1;

		this.maxState = ImageLoader.imgSizes.length - 1;
	}

	loadImage () {
		if (this.imageState >= 0 && !(this.imageState in this.file.data)) {
			let rotations = {3: 180, 6: 90, 8: -90};
			if (ImageLoader.imgSizes[this.imageState] == "/" && this.file.orientation in rotations) {
				let data = getRotatedImage(this.image.get(0), rotations[this.file.orientation]);
				this.image.get(0).src = data;
				this.file.data[this.imageState] = data;
			} else this.file.data[this.imageState] = getBase64Image(this.image.get(0));
		}

		if (this.imageState + 1 > this.maxState) return;

		if (!this.image.get(0).onload) {
			let parent = this;
			this.image.get(0).onload = function () { parent.loadImage(); };
			this.image.get(0).onerror = function () { parent.loadImage(); };
		}

		for (var i = this.maxState; i > this.imageState; i--) {
			if (i in this.file.data) {
				this.image.attr("src", this.file.data[i]);
				this.imageState = i;
				return;
			}
		}

		this.imageState += 1;

		this.image.attr("src", serverUrl + "api/images/" + this.file.id + ImageLoader.imgSizes[this.imageState]);

		if (this.onloadimg) this.onloadimg();
	}
}

ImageLoader.imgSizes = ["/thumbnail/", "/300x200/", "/1800x1200/", "/"];

// Image modal class
class ImageModal extends ImageLoader {
	connectedCallback () {
		this.open = false;
		this.dragging = { isMoving: false };

		let parent = this;
		window.addEventListener("load", function () {
			$(parent).find("*").each(function () { this.modal = parent; });
		});
	}

	openFile (file) {
		this.file = file;
		this.imageState = -1;
		this.loadImage();

		this.setZoom();

		this.displayArrows();

		this.show();
	}

	switchFile (direction) {
		if (pageLoader.data.objectType == "files") {
			this.openFile(pageLoader.filesContainer.getAdjacentFile(this.file, direction, "image"));
		} else if (pageLoader.data.objectType == "faces") {
			this.openFile(pageLoader.filesContainer.getAdjacentFile({id: this.file.parent}, direction).file);
		}
	}

	displayArrows () {
		$(this).find(".im-arrow").css("display", "none");
		if (pageLoader.data.objectType == "files") {
			if (pageLoader.filesContainer.getAdjacentFile(this.file, -1, "image")) {
				$(this).find("#im-arrow-left").css("display", "");
			}
			if (pageLoader.filesContainer.getAdjacentFile(this.file, 1, "image")) {
				$(this).find("#im-arrow-right").css("display", "");
			}
		} else if (pageLoader.data.objectType == "faces") {
			if (pageLoader.filesContainer.getAdjacentFile({id: this.file.parent}, -1)) {
				$(this).find("#im-arrow-left").css("display", "");
			}
			if (pageLoader.filesContainer.getAdjacentFile({id: this.file.parent}, 1)) {
				$(this).find("#im-arrow-right").css("display", "");
			}
		}
	}

	show () {
		if (this.open) return;

		$(this).css("visibility", "visible");

		this.image.removeClass("im-image-hidden").addClass("im-image-shown");

		this.open = true;
	}

	hide () {
		if (!this.open) return;

		this.image.removeClass("im-image-shown").addClass("im-image-hidden");
		$(this).css("visibility", "hidden");

		this.open = false;
	}

	get image () {
		return $(this).find("#im-image");
	}

	get open () {
		return $(this).attr("data-open") == "true";
	}

	set open (value) {
		return $(this).attr("data-open", value);
	}

	onloadimg () {
		this.setZoom("min", "min", "c", "c");
	}

	//Set the zoom and position of the image
	setZoom (maxW, maxH, xPos, yPos) {
		if (!this.open) return;

		// TODO need to get pageLoader.config.platform before this will work

		// Calculate bounding box
		maxW = (maxW || this.file.zoom.maxW) || "min";
		maxH = (maxH || this.file.zoom.maxH) || "min";
		if (maxW == "max") maxW = this.file.width;
		else if (maxW == "min") maxW = window.innerWidth - (pageLoader.config.platform == "mobile" ? 0 : 300);
		if (maxH == "max") maxH = this.file.height;
		else if (maxH == "min") maxH = (window.innerHeight - (pageLoader.config.platform == "mobile" ? 0 : $(this).find("#im-toolbar").get(0).clientHeight)) * (pageLoader.config.platform == "mobile" ? 1 : 0.9);
		// TODO faces support

		//maxW = (maxW || this.file.zoom.maxW) || (window.innerWidth - (pageLoader.config.platform == "mobile" ? 0 : 300));
		//maxH = (maxH || this.file.zoom.maxH) || (window.innerHeight - (pageLoader.config.platform == "mobile" ? 0 : $(this).find("#im-toolbar").get(0).clientHeight)) * (pageLoader.config.platform == "mobile" ? 1 : 0.9);


		// Calculate new size
		var newWidth, newHeight;
		if (maxW / maxH > this.file.width / this.file.height) {
			newWidth = maxH * this.file.width / this.file.height;
			newHeight = maxH;
		} else {
			newWidth = maxW;
			newHeight = maxW * this.file.height / this.file.width;
		}

		$(this).find("#im-image").css({"width": newWidth + "px", "height": newHeight + "px"});


		// Calculate new position
		if (xPos === 0) xPos = 0.01;
		if (yPos === 0) yPos = 0.01;
		xPos = (xPos || this.file.zoom.xPos) || "c";
		yPos = (yPos || this.file.zoom.yPos) || "c";
		if (xPos == "c") xPos = (window.innerWidth - newWidth) / 2;
		if (yPos == "c") yPos = (window.innerHeight - newHeight + (pageLoader.config.platform == "mobile" ? 0 : $(this).find("#im-toolbar").get(0).clientHeight)) / 2;

		// TODO faces support
		//xPos = (xPos || this.file.zoom.xPos) || (window.innerWidth - newWidth) / 2;
		//yPos = (yPos || this.file.zoom.yPos) || (window.innerHeight - newHeight + (pageLoader.config.platform == "mobile" ? 0 : iPTopBar.clientHeight)) / 2;

		$(this).find("#im-image").css({"left": xPos + "px", "top": yPos + "px"});

		// TODO faces support
		this.file.zoom = {
			maxW: maxW,
			maxH: maxH,
			xPos: xPos,
			yPos: yPos
		};
	}

	// Zoom in or out on the image
	zoom (scale, xPoint, yPoint) {
		let oldX = getStyleValue($(this).find("#im-image").get(0).style.left);
		let oldY = getStyleValue($(this).find("#im-image").get(0).style.top);
		let newX = xPoint - (xPoint - oldX) * scale;
		let newY = yPoint - (yPoint - oldY) * scale;

		let newW = getStyleValue($(this).find("#im-image").get(0).style.width) * scale;
		let newH = getStyleValue($(this).find("#im-image").get(0).style.height) * scale;

		this.setZoom(newW, newH, newX, newY);
	}

	// Drag the image
	drag (event) {
		if (!this.dragging.isMoving) return;

		var deltaX = event.clientX - this.dragging.startX;
		var deltaY = event.clientY - this.dragging.startY;

		if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

		var newX = (getStyleValue($(this).find("#im-image").get(0).style.left) + deltaX - this.dragging.doneX);
		var newY = (getStyleValue($(this).find("#im-image").get(0).style.top) + deltaY - this.dragging.doneY);

		$(this).find("#im-image").css({"left": newX, "top": newY});

		this.dragging.doneX = deltaX;
		this.dragging.doneY = deltaY;

		this.file.zoom.xPos = newX;
		this.file.zoom.yPos = newY;
	}

	// Begin dragging the image
	startDrag (event) {
		this.dragging.isMoving = true;
		this.dragging.startX = event.clientX;
		this.dragging.startY = event.clientY;
		this.dragging.doneX = 0;
		this.dragging.doneY = 0;
	}
}

window.customElements.define("image-modal", ImageModal);
