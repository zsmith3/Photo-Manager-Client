import $ from "jquery";

declare global {
	var app: App;
}

$(document).ready(function () {
	app = new App();
	app.init();

	mdcSetupRipples($(".mdc-toolbar").get(0));
	$(".mdc-text-field--textarea").each(function () { this.api = new mdc.textField.MDCTextField(this); });
	Events.resize();
});

var Events = {
	oldWidth: 1000,
	resize: function (): void {
		if (window.innerWidth < 800 && Events.oldWidth >= 800) {
			Events.onWindowSmaller();
		} else if (window.innerWidth >= 800 && Events.oldWidth < 800) {
			Events.onWindowLarger();
		}

		Events.oldWidth = window.innerWidth;
	},
	onWindowSmaller: function (): void {
		app.els.navDrawer.setTemporary();
		app.els.navDrawer.optionsMenuToDrawer();
		app.els.sortBar.toNavDrawer();
		app.els.toolBar.refresh(true);
		app.els.toolBar.hide(true);
		app.els.addressBar.hideSearch();
	},
	onWindowLarger: function (): void {
		app.els.navDrawer.setPermanent();
		app.els.navDrawer.optionsMenuToHeader();
		app.els.sortBar.fromNavDrawer();
		app.els.toolBar.refresh(true);
		app.els.toolBar.show(true);
		app.els.addressBar.showSearch();
	}
};

window.onresize = Events.resize;
