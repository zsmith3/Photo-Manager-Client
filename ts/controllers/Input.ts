// Structure to handle input events
var Input = {
	keysDown: {},
	xPos: -1,
	yPos: -1,
	touchesDown: 0,

	// Register pressed key
	keydown: function (event) {
		if (event.key == " ") event.key = "Space";

		Input.keysDown[event.key] = true;

		if ("on" + event.key in Input) {
			Input["on" + event.key]();
		}
	},

	// Remove pressed key
	keyup: function (event) { Input.keysDown[event.key] = false; },

	// Clear all pressed keys
	clearKeysDown: function () { for (var key in Input.keysDown) Input.keysDown[key] = false; },

	// Test if a key is down
	isDown: function (key) {
		if (key in Input.keysDown) return Input.keysDown[key];
		else return false;
	},

	onEscape: function () {
		app.els.imageModal.hide();
	},

	onArrowLeft: function () {
		if (app.els.imageModal.open) app.els.imageModal.switchFile(-1);
		else app.els.filesCont.moveSelection("x", -1);
	},

	onArrowRight: function () {
		if (app.els.imageModal.open) app.els.imageModal.switchFile(1);
		else app.els.filesCont.moveSelection("x", 1);
	},

	onArrowUp: function () { if (!app.els.imageModal.open) app.els.filesCont.moveSelection("y", -1); },

	onArrowDown: function () { if (!app.els.imageModal.open) app.els.filesCont.moveSelection("y", 1); },

	// TODO mobile stuff

	/* onSpace: function () {
		if (!modalIsOpen()) { // TODO Input
			event.preventDefault();
			confirmAction("star", "star %f");
			$("#modal-confirm").modal("open");
		}
	},

	onDelete: function () {
		if (!modalIsOpen()) {
			event.preventDefault();
			confirmAction("delete", "mark %f for deletion");
			$("#modal-confirm").modal("open");
		}
	}, */

	on0: function () { app.els.imageModal.setZoom("min", "min", "c", "c"); },

	on1: function () { app.els.imageModal.setZoom("max", "max", "c", "c"); },

	mousemove: function (event) {
		Input.xPos = event.clientX;
		Input.yPos = event.clientY;
		// app.els.imageModal.drag(event);
	},

	touchstart: function (event) {
		Input.touchesDown++;
	},

	touchend: function (event) {
		Input.touchesDown--;
	},

	click: function (event) {
		let target = event.composedPath().filter(element => $(element).is("a"));
		if (target.length > 0) {
			target = target[0];
			if ($(target).attr("rel") == "external") {
				return;
			} else {
				event.preventDefault();

				if ($(target).hasClass("mdc-tab")) return;

				if ($(target).attr("rel") == "no-refresh") {
					app.refreshPage($(target).attr("data-fpp") || null, $(target).attr("data-page") || null);
				} else {
					app.refreshFilesData(target.pathname, $(target).attr("data-api"), null, $(target).attr("data-rel"));
				}
			}
		}
	}
};

// Attach input events to window
window.onkeydown = Input.keydown;
window.onkeyup = Input.keyup;
window.onblur = Input.clearKeysDown;

window.onmousemove = Input.mousemove;

window.onclick = Input.click;

window.ontouchstart = Input.touchstart;
window.ontouchend = Input.touchend;
