//Context menu class
class ContextMenu extends MDCMenu {
	//Open on right-click
	open (fbox, event) {
		if (app.config.platform == "mobile") return false;

		if (!$(fbox).find("input[type=checkbox]").prop("checked")) fbox.select();

		$(this).css({
			"left": event.clientX + "px",
			"top": event.clientY + "px"
		});

		let fullHeight = $(this).find(".mdc-menu__items > .mdc-list-item").length * 36 + $(this).find(".mdc-menu__items > .mdc-list-divider").length + 16;
		let menuHeight = 0;

		if (window.innerHeight - event.clientY >= fullHeight) {
			$(this).css({
				"top": event.clientY + "px"
			});
			menuHeight = fullHeight;
		} else if (event.clientY >= fullHeight) {
			$(this).css({
				"top": (event.clientY - fullHeight) + "px",
			});
			menuHeight = fullHeight;
		} else if (event.clientY <= window.innerHeight / 2) {
			$(this).css({
				"top": event.clientY + "px"
			});
			menuHeight = window.innerHeight - event.clientY;
		} else {
			$(this).css({
				"bottom": (window.innerHeight - event.clientY) + "px",
			});
			menuHeight = event.clientY;
		}

		$(this).find(".mdc-menu").css("height", menuHeight + "px");

		super.open();

		/* $(this).css({"opacity": "1",
			"width": "200px",
			"height": menuHeight + "px"
		});
		setTimeout(function () {
			$(this).css({
				"transition": "opacity .2s",
				"overflow": "auto"
			});
		}, 200); */
	}
/*
	//Hide menu
	hide () {
		$(this).css("opacity", "0");
		setTimeout(function () {
			$(this).css({"width": "0px",
				"height": "0px",
				"transition": "width .2s, height .2s",
				"overflow": "hidden"
			});
		}, 200);
	} */
}

window.customElements.define("context-menu", ContextMenu);
