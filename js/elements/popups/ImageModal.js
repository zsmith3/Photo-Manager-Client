// Image modal class
class ImageModal extends HTMLElement {
	connectedCallback () {
		this.open = false;
		this.dragging = { doneX: 0, doneY: 0, scaleDone: 1, resetTimeout: -1 };

		let _this = this;
		window.addEventListener("load", function () {
			$(_this).find("*").each(function () { this.modal = _this; });
		});

		setTimeout(function () {
			_this.hammerApi = new Hammer($(_this).find("#im-image").get(0));
			_this.hammerApi.on("swipe", function (event) {
				if (pageLoader.config.platform == "mobile") {
					let direction = Math.round(-event.deltaX / 100);
					direction = direction / Math.abs(direction);
					if (direction) _this.switchFile(direction);
				}
			});

			_this.hammerApi.get("pinch").set({ enable: true });
			_this.hammerApi.on("pinch", function (event) {
				if (event.eventType == Hammer.INPUT_START) _this.dragging.scaleDone = 1;

				_this.zoom(event.scale / _this.dragging.scaleDone, event.center.x, event.center.y);
				_this.dragging.scaleDone = event.scale;

				_this.setResetTimeout();
			});

			_this.hammerApi.on("pan", function (event) {
				_this.drag(event);

				_this.setResetTimeout();
			});
		}, 0);
	}

	openFile (file) {
		this.file = file;

		let _this = this;
		if (!this.imageLoader) this.imageLoader = new ImageLoader(this.image.get(0), null, null, function () {
			_this.setZoom("min", "min", "c", "c");
			_this.imageLoader.onImageLoad = null;
		});

		$(this).find("#im-title").text(this.file.name);

		this.imageLoader.update(this.file);

		this.setZoom();

		this.displayArrows();

		this.show();
	}

	switchFile (direction) {
		if (pageLoader.data.objectType == "files") {
			let nextFile = pageLoader.filesContainer.getAdjacentFile(this.file, direction, "image");
			if (nextFile) this.openFile(nextFile);
		} else if (pageLoader.data.objectType == "faces") {
			let nextFile = pageLoader.filesContainer.getAdjacentFile({id: this.file.parent}, direction).file;
			if (nextFile) this.openFile();
		}
	}

	displayArrows () {
		$(this).find(".im-arrow").css("display", "none");

		if (pageLoader.config.platform == "mobile") return;

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

		if (window.innerWidth < 800) $("#toolBar-menu").appendTo($(this).find("#im-toolbar"));

		this.open = true;
	}

	hide () {
		if (!this.open) return;

		this.image.removeClass("im-image-shown").addClass("im-image-hidden");
		$(this).css("visibility", "hidden");

		$(this).find("#toolBar-menu").appendTo(".mdc-toolbar__section--align-end");

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
		else if (maxH == "min") maxH = window.innerHeight - (pageLoader.config.platform == "mobile" ? 0 : $(this).find("#im-toolbar").get(0).clientHeight);
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
		if (Math.abs(event.deltaX) < 10 && Math.abs(event.deltaY) < 10) return;

		var newX = getStyleValue($(this).find("#im-image").get(0).style.left) + event.deltaX - this.dragging.doneX;
		var newY = getStyleValue($(this).find("#im-image").get(0).style.top) + event.deltaY - this.dragging.doneY;

		$(this).find("#im-image").css({"left": newX, "top": newY});

		this.dragging.doneX = event.deltaX;
		this.dragging.doneY = event.deltaY;

		this.file.zoom.xPos = newX;
		this.file.zoom.yPos = newY;

		if (event.eventType == Hammer.INPUT_END) {
			this.dragging.doneX = 0;
			this.dragging.doneY = 0;
		}
	}

	clearToolbarButtons () {
		$(this).find("#im-icons-left").html("");
		$(this).find("#im-icons-right").html("");
	}

	addToolbarButton (layout, toolBar) {
		if ("top" in layout && "bottom" in layout) {
			this.addToolbarButton(layout.top, toolBar);
			this.addToolbarButton(layout.bottom, toolBar);
			return;
		}

		let button = $("<button></button>").addClass("im-button").appendTo($(this).find("#im-icons-left"));

		let _this = this;
		toolBar.setOnClick(button.get(0), layout, function () {
			_this.selectCurrentFile();
		});

		button.attr("title", layout.title);

		for (var i = 0; i < layout.icon.length; i++) {
			$("<i class='material-icons'></i>").text(layout.icon[i]).appendTo(button);
		}
	}

	updateButtonPositions () {
		let allButtons = $(this).find("#im-icons-left .im-button, #im-icons-left .im-button");

		for (var i = 0; i <= allButtons.length / 2; i++) $(allButtons.get(i)).appendTo($(this).find("#im-icons-left"));
		for (; i < allButtons.length; i++) $(allButtons.get(i)).appendTo($(this).find("#im-icons-right"));

		let maxWidth = Math.max($(this).find("#im-icons-left").width(), $(this).find("#im-icons-right").width() + 80);
		$(this).find("#im-icons-left").css("width", maxWidth + "px");
		$(this).find("#im-icons-right").css("width", (maxWidth - 80) + "px");

		let totalUsed = $(this).find("#im-icons-left").width() + $(this).find("#im-icons-right").width() + 140;
		let maxLeft = window.innerWidth - totalUsed;

		$(this).find("#im-title").css("max-width", maxLeft);
	}

	selectCurrentFile () {
		pageLoader.filesContainer.selectAll(false);
		let fbox = pageLoader.filesContainer.getFilebox(this.file.id);
		fbox.selected = true;
		fbox.updateSelection();
	}

	setResetTimeout () {
		window.clearTimeout(this.dragging.resetTimeout);

		if (pageLoader.config.platform == "mobile") {
			let _this = this;
			this.dragging.resetTimeout = window.setTimeout(function () { if (Input.touchesDown == 0) _this.setZoom("min", "min", "c", "c"); }, 100);
		}
	}
}

window.customElements.define("image-modal", ImageModal);
