// Sorting bar class
class SortBar extends HTMLElement {
	// Initialise sort-bar
	init () {
		this.getSelector("mdc-select").each(function () { this.initOptions(); });
		$("#sortbar-viewswitcher").parent().get(0).resetAPI();
		mdcSetupRipples(this);
	}

	// Refresh the sorting bar
	refresh () {
		this.refreshSelects();
		//this.refreshPagination();
		this.refreshThumbscaler();
	}

	getSelector (selector) {
		return $.merge($(this).find(selector), $("#nav-drawer-sortBar").find(selector));
	}

	toNavDrawer () {
		let navSortBar = $("<nav></nav>").attr("id", "nav-drawer-sortBar").prependTo(navigationDrawer);
		$("<hr />").addClass("mdc-list-divider").insertAfter(navSortBar);
		$(this).find("#thumbScaleDiv, mdc-select").appendTo(navSortBar);
		$("<h4></h4>").text("Sorting Options")
			.appendTo($("<span></span>").addClass("mdc-list-item nav-title mdc-ripple-surface").prependTo(navSortBar));
		$(navSortBar).find("mdc-slider").each(function () { this.resetAPI(); });
	}

	fromNavDrawer () {
		$("#nav-drawer-sortBar > *:not(.nav-title)").appendTo(this);
		$("#nav-drawer-sortBar").remove();
	}

	// Refresh sort bar selects TOREM refreshsbselects
	refreshSelects () {
		// TODO
		//$("#filecount").val(queryString.get("fpp"));
		this.getSelector("#select-mode").val(pageLoader.config.get("select_mode"));
		this.getSelector("#filecount").val(pageLoader.config.get("fpp"));
	}

	// Refresh the page numbers shown
	refreshPagination (fileCount) {
		let div = $("#pageNumbers").html("");

		let page = pageLoader.getQueryParam("page");
		let maxPage = Math.ceil(fileCount / pageLoader.getQueryParam("fpp"));

		if (page > 1) {
			$("<a></a>")
				.addClass("pageLink material-icons")
				.attr("href", getUrl(null, true, {page: page - 1}))
				.attr("data-page", page - 1)
				.attr("rel", "no-refresh")
				.text("keyboard_arrow_left")
				.appendTo(div);
			$(document.createTextNode(" ")).appendTo(div);
		}

		let firstPage = 1;
		if (page > 3) firstPage = page - 3;

		for (var i = firstPage; i <= maxPage && i < firstPage + 6; i++) {
			if (page == i) $("<span></span>").addClass("pageLink").text(i).appendTo(div);
			else $("<a></a>").addClass("pageLink").attr("href", getUrl(null, true, {page: i})).attr("data-page", i).attr("rel", "no-refresh").text(i).appendTo(div);
			$(document.createTextNode(" ")).appendTo(div);
		}

		if (page < maxPage) {
			$("<a></a>")
				.addClass("pageLink material-icons")
				.attr("href", getUrl(null, true, {page: page + 1}))
				.attr("data-page", page + 1)
				.attr("rel", "no-refresh")
				.text("keyboard_arrow_right")
				.appendTo(div);
		}
	}

	// Refresh the thumbnail scaler
	refreshThumbscaler () {
		this.getSelector("#thumbScaler").each(function () {
			this.min = pageLoader.config.defaults.thumb_scale.min;
			this.max = pageLoader.config.defaults.thumb_scale.max;
			$(this).val(pageLoader.config.get("thumb_scale"));
		});
	}

	// Refresh the view switcher
	refreshViewSwitcher () {
		$("#sortbar-viewswitcher").parent().get(0).api.setActiveTabIndex_($("#sortbar-viewswitcher .mdc-tab").map(function () { return $(this).attr("value"); }).toArray().indexOf(pageLoader.data.viewName));
	}
}

window.customElements.define("sort-bar", SortBar);
