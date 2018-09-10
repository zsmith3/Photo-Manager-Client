var pageLoader;

$(document).ready(function () {
	pageLoader = new PageLoader($("#filesContainer").get(0), $("#filesMap").get(0));
	pageLoader.init();

	mdcSetupRipples($(".mdc-toolbar").get(0));
	$(".mdc-text-field--textarea").each(function () { this.api = new mdc.textField.MDCTextField(this); });
	Events.resize();
});

var Events = {
	oldWidth: 1000,
	resize: function () {
		if (window.innerWidth < 800 && Events.oldWidth >= 800) {
			Events.onWindowSmaller();
		} else if (window.innerWidth >= 800 && Events.oldWidth < 800) {
			Events.onWindowLarger();
		}

		Events.oldWidth = window.innerWidth;
	},
	onWindowSmaller: function () {
		// TODO copy anything relevant
		navigationDrawer.setTemporary();
		navigationDrawer.optionsMenuToDrawer();
		sortBar.toNavDrawer();
		toolBar.refresh(true);
		toolBar.hide(true);
		addressBar.hideSearch();
	},
	onWindowLarger: function () {
		// TODO
		navigationDrawer.setPermanent();
		navigationDrawer.optionsMenuToHeader();
		sortBar.fromNavDrawer();
		toolBar.refresh(true);
		toolBar.show(true);
		addressBar.showSearch();
	}
};

window.onresize = Events.resize;
