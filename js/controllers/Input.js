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
	clearKeysDown: function () { for (key in Input.keysDown) Input.keysDown[key] = false; },

	// Test if a key is down
	isDown: function (key) {
		if (key in Input.keysDown) return Input.keysDown[key];
		else return false;
	},

	onEscape: function () {
		$("image-modal").get(0).hide();
	},

	onArrowLeft: function () {
		if ($("image-modal").get(0).open) $("image-modal").get(0).switchFile(-1);
		else pageLoader.filesContainer.moveSelection("x", -1);
	},

	onArrowRight: function () {
		if ($("image-modal").get(0).open) $("image-modal").get(0).switchFile(1);
		else pageLoader.filesContainer.moveSelection("x", 1);
	},

	onArrowUp: function () { if (!$("image-modal").get(0).open) pageLoader.filesContainer.moveSelection("y", -1); },

	onArrowDown: function () { if (!$("image-modal").get(0).open) pageLoader.filesContainer.moveSelection("y", 1); },

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

	on0: function () { $("image-modal").get(0).setZoom("min", "min", "c", "c"); },

	on1: function () { $("image-modal").get(0).setZoom("max", "max", "c", "c"); },

	mousemove: function (event) {
		Input.xPos = event.clientX;
		Input.yPos = event.clientY;
		// $("image-modal").get(0).drag(event);
	},

	/* mouseup: function (event) {
		if ($("image-modal").get(0).dragging.isMoving) {
			setTimeout(function () { $("image-modal").get(0).dragging.isMoving = false; }, 50);

			event.stopPropagation();
		}
	}, */

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
					pageLoader.refreshPage($(target).attr("data-fpp") || null, $(target).attr("data-page") || null);
				} else {
					pageLoader.refreshFilesData(target.pathname, $(target).attr("data-api"), null, $(target).attr("data-rel"));
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
window.onmouseup = Input.mouseup;

window.onclick = Input.click;

window.ontouchstart = Input.touchstart;
window.ontouchend = Input.touchend;
