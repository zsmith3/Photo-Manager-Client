/** Filter bar element */
class FilterBar extends ToggleBar {
	// TODO need this for its relation to searching
	// TODO then need to add searching to albums/people
	//	consider prioritising based on which text the queries appear in, not just which queries show up

	/** Refresh filter list */
	refresh () {
		mdcSetupRipples(this);

		this.sortable = Sortable.create($("#filterBar-list").get(0), {animation: 150, handle: ".filterhandle", draggable: ".draggable"});

		let filters = app.getQueryParam("filter").split("/");
		for (var i in filters) {
			let newItem = this.add(true);

			if (i == 0) {
				newItem.removeClass("draggable");
				newItem.find(".filter-aspect").get(0).api.disabled = true;
				newItem.find(".filterhandle").css("display", "none");
				newItem.find(".filterclose").css("display", "none");
			}

			//newItem.find("mdc-select").each(function () { this.initOptions(); });

			newItem.find(".filter-action").val(filters[i].substr(0, 1));
			newItem.find(".filter-aspect").val(filters[i].substr(1, 1));
			this.setValues(newItem.find(".filter-aspect").get(0), true);
			newItem.find(".filter-value").val(filters[i].substr(2));
		}

		$("#filterBar-isf-check").get(0).checked = app.getQueryParam("isf");

		/* if (allData.page_meta.filters == oldData.page_meta.filters) return;

		$(".filteritem").remove();
		for (var i = 0; i < startFilters.length; i++) {
			let filter = startFilters[i];
			let fAction = filter.substr(0, 1);
			let fAspect = filter.substr(1, 1);
			let fValue = filter.substr(2);

			let newItem = this.add(true);

			if (i == 0) {
				newItem.removeClass("draggable");
				newItem.find("mdc-select[name=faspect]").attr("disabled", true);
				newItem.find(".filterhandle").css("display", "none");
				newItem.find(".filterclose").css("display", "none");
			}

			newItem.find("mdc-select").each(function () { this.initOptions(); });

			newItem.find("mdc-select[name=faction]").val(fAction);
			newItem.find("mdc-select[name=faspect]").val(fAspect);
			this.setValues(newItem.find("mdc-select[name=faspect]").get(0), true);
			newItem.find("mdc-select[name=fvalue]").val(fValue);
		}

		$("#filterBar-isf-check").attr("checked", includeSubFolders); */
	}

	//Set filter-value select
	setValues (select) {
		let aspect = select.value;
		let valueSel = $(select).closest(".filteritem").find(".filter-value");

		if (aspect in FilterBar.filterValues) {
			valueSel.css("display", "");
			valueSel.find("option").remove();
			for (var value in FilterBar.filterValues[aspect]) {
				$("<option></option>")
					.val(value)
					.text(FilterBar.filterValues[aspect][value])
					.appendTo(valueSel);
			}
			valueSel.get(0).initOptions();
		} else {
			valueSel.css("display","none");
		}
		$("#filterBar").attr("data-size", ($("#filterBar-list").height() + 50) + "px");
		if ($("#filterBar").css("max-height") != "0px") $("#filterBar").css("max-height", ($("#filterBar-list").height() + 50) + "px");
	}

	//Add a new filter item
	add () {
		var newItem = $($("#template-filterItem").html().trim()).clone();

		newItem.insertBefore("#filterBar-button-add");

		$(newItem).find("mdc-select").each(function () { this.initOptions(); });

		$("#filterBar").attr("data-size", ($("#filterBar-list").height() + 50) + "px");
		if ($("#filterBar").css("max-height") != "0px") $("#filterBar").css("max-height", ($("#filterBar-list").height() + 50) + "px");

		mdcSetupRipples(newItem);

		return newItem;
	}

	//Submit filters
	submit () {
		let filterArray = $(".filteritem").map(function () {
			return $(this).find(".filter-action").val() + $(this).find(".filter-aspect").val() + $(this).find(".filter-value").val();
		}).toArray();
		let filterStr = filterArray.join("/");
		app.refreshFilesData(null, null, {"filter": filterStr, "isf": $("#filterBar-isf-check").get(0).checked});
	}
}

window.customElements.define("filter-bar", FilterBar);

//Filtering functions
FilterBar.filterFuncs = {
	"*": function(f, v) { return true; },
	"S": function(f, v) { return f.starred; },
	"D": function(f, v) { return f.deleted; },
	"T": function(f, v) { return f.tags.indexOf(allTags[v]) != -1; },
	"P": function(f, v) { return f.people.indexOf(v) != -1; },
	"A": function(f, v) { return f.albums.indexOf(v) != -1; },
	"F": function(f, v) { return f.fType == v; }
};

//Filter values
FilterBar.filterValues = {
	get P() { return {}; },
	get G() { return GeoTagArea.areas.reduce(function(result, area) { result[area.id] = area.name; return result; }, {}); },
	get T() { return {}; },
	get A() { return Album.getAll(); },
	F: {"img": "Images","video": "Videos", "file": "Files","folder": "Folders"}
};

//Run a set of filters on a list of files
FilterBar.filter = function (fileList, filters) {
	for (var i = 0; i < filters.length; i++) {
		filter = filters[i];

		fAction = filter[0] == "I";
		fAspect = filter[1];
		fValue = filter.substr(2);

		for (var j = 0; j < fileList.length; j++) {
			f = fileList[j];
			if (FilterBar.filterFuncs[fAspect](f, fValue)) f.include = fAction;
		}
	}

	newFiles = [];
	for (i = 0; i < fileList.length; i++) {
		f = fileList[i];
		if (f.include) {
			delete f.include;
			newFiles.push(f);
		}
	}
	fileList = newFiles;

	return fileList;
};
