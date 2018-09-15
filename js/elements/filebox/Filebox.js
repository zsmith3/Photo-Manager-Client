// File box element class
class Filebox extends HTMLElement {
	constructor () {
		super();

		this.template = "#template-filebox";

		this.classes = "mdc-elevation--z1 mdc-ripple-surface mdc-ripple-surface--primary";
	}

	connectedCallback () {
		$($(this.template).html().trim()).clone().appendTo(this);

		$(this).addClass(this.classes);

		mdcSetupRipples(this);

		if ($(this).attr("data-parent")) {
			this.container = $($(this).attr("data-parent")).get(0);
		} else {
			this.container = $(this).closest("files-container").get(0);
		}

		this.onclick = function (event) {
			event.stopPropagation();

			if (pageLoader.config.get("select_mode") == 1) {
				this.file.open();
			} else {
				this.select($(event.target).is(".mdc-checkbox__native-control"));
			}
		};

		this.ondblclick = function () {
			if (pageLoader.config.get("select_mode") == 0) {
				this.file.open();
			}
		};

		this.hammerApi = new Hammer(this);
		this.hammerApi.parent = this;
		this.hammerApi.on("press", function (event) {
			window.navigator.vibrate(100);
			pageLoader.config.set("select_mode", 2);
			$(event.target).closest("file-box, face-box").get(0).select();
		});

		this.onmouseover = function (event) {
			infoPopup.setup(this, event);
		};

		this.onmouseout = function (event) {
			infoPopup.hide(this, event);
		};

		this.oncontextmenu = function (event) {
			contextMenu.open(this, event);
			return false;
		};

		/*let parent = this;
		$(this).find(".imgthumb").on("load", function () {
			if ("data" in parent.file) { // TODO not sure this is needed
				let rotations = {3: 180, 6: 270, 8: 90};
				if (parent.file.orientation in rotations) {
					let data = getRotatedImage(this, rotations[parent.file.orientation]);
					this.src = data;
					parent.file.data[0] = data;
				} else parent.file.data[0] = getBase64Image(this);
			}

			let img = this;
			let checkData = function () {
				if (parent.file) {
					if ("data" in parent.file) parent.file.data[0] = getBase64Image(img);
				} else {
					setTimeout(checkData, 500);
				}
			};
			checkData();
		});*/

		this.generate();
	}

	generate () {
		var file = this.file;

		if (file === null) return;

		if (file.type == "image") {
			this.imageLoader = new ImageLoader($(this).find(".imgthumb").get(0), file, 1);
			// this.loadImage();
			$(this).find(".imgthumb").css("display", "block");
		} else if (file.type == "video") {
			// TODO
		} else if (file.type == "folder") {
			// TODO
		} else {
			// TODO
		}

		$(this).find(".thumbbox").attr("data-type", file.type);

		$(this).find(".filename").text(file.name);

		this.showIcons();

		this.scale();
	}

	scale (scale) {
		scale = parseInt(scale || $("#thumbScaler").val());
		var selMode = pageLoader.config.get("select_mode");
		var boxSize;
		if (selMode == 0) boxSize = scale + 20;
		else {
			boxSize = scale;
			if (selMode == 2) scale -= 20;
		}

		$(this).css({"width": boxSize, "height": boxSize});
		$(this).find(".filecheckbox").get(0).setSize(Math.sqrt(scale) * 1.2);

		let updates = {
			".thumbbox": {"font-size": (scale * 2 / 3) + "px", "line-height": (scale * 2 / 3) + "px", "margin-top": selMode == 1 ? "5%" : 0},
			".fcbox-cont": {"height": "calc(5% + " + (Math.sqrt(scale) * 1.2 + 6) + "px)", "display": selMode == 1 ? "none" : ""},
			".filename": {"font-size": Math.sqrt(scale) * 1.2},
			".filestar": {"font-size": (scale / 4) + "px"},
			".filebin": {"font-size": (scale / 3) + "px"}
		};

		for (var selector in updates) $(this).find(selector).css(updates[selector]);

		if (selMode == 1) $(this).find(".thumbbox").addClass("fullthumbbox");
		else $(this).find(".thumbbox").removeClass("fullthumbbox");

		this.rippleAPI.layout();
	}

	select (checkboxClicked) {
		if (Input.isDown("Control") || (pageLoader.config.get("select_mode") == 2 && !checkboxClicked)) {
			this.selected = !this.selected;
		} else if (Input.isDown("Shift")) {
			this.container.selectAll(false, true);
			this.container.selectRange(this);
		} else if (!checkboxClicked) {
			this.container.selectAll(false, true);
			this.selected = true;
		}

		this.updateSelection();
		this.container.lastSelected = this;
		this.container.onSelectionChange();
	}

	updateSelection () {
		if (this.selected) {
			$(this).removeClass("mdc-elevation--z1").addClass("mdc-elevation--z4");
			$(this).addClass("file-selected");
		} else {
			$(this).removeClass("mdc-elevation--z4").addClass("mdc-elevation--z1");
			$(this).removeClass("file-selected");
		}
	}

	showIcons () {
		$(this).find(".filestar").css("display", this.file.starred ? "block" : "none");
		$(this).find(".filebin").css("display", this.file.deleted ? "block" : "none");
	}

	get file () {
		return this.container.getFile($(this).attr("data-id"));
	}

	get image () {
		return $(this).find(".imgthumb");
	}

	get checkbox () { return $(this).find(".filecheckbox, .facecheckbox").get(0); }

	get selected () { return this.checkbox.checked; }

	set selected (value) { this.checkbox.checked = value; }
}

window.customElements.define("file-box", Filebox);
