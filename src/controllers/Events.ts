import $ from "jquery";

$(document).ready(function() {
	app = new App();
	App.app.init();

	mdcSetupRipples($(".mdc-toolbar").get(0));
	$(".mdc-text-field--textarea").each(function() {
		this.api = new mdc.textField.MDCTextField(this);
	});
	Events.resize();
});

var Events = {
	oldWidth: 1000,
	resize: function(): void {
		if (window.innerWidth < 800 && Events.oldWidth >= 800) {
			Events.onWindowSmaller();
		} else if (window.innerWidth >= 800 && Events.oldWidth < 800) {
			Events.onWindowLarger();
		}

		Events.oldWidth = window.innerWidth;
	},
	onWindowSmaller: function(): void {
		App.app.els.navDrawer.setTemporary();
		App.app.els.navDrawer.optionsMenuToDrawer();
		App.app.els.sortBar.toNavDrawer();
		App.app.els.toolBar.refresh(true);
		App.app.els.toolBar.hide(true);
		App.app.els.addressBar.hideSearch();
	},
	onWindowLarger: function(): void {
		App.app.els.navDrawer.setPermanent();
		App.app.els.navDrawer.optionsMenuToHeader();
		App.app.els.sortBar.fromNavDrawer();
		App.app.els.toolBar.refresh(true);
		App.app.els.toolBar.show(true);
		App.app.els.addressBar.showSearch();
	}
};

window.onresize = Events.resize;
