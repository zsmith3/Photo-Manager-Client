//Display the list of existing synced folders to user
function displaySyncs() {
	syncs = JSON.parse(window.localStorage.getItem("sync"));
	for (var i = 0; i < syncs.length; i++) {
		createSyncRow(i, syncs[i]);
	}

	params = new URLSearchParams(window.location.search);
	if (params.get("remote") !== null) {
		createSyncRow(syncs.length, {remote: params.get("remote"), local: "", autoUpdate: true, useSize: false, useTime: false});
	}

	$("#savemeta").prop("checked", window.localStorage.getItem("saveDataOffline") == "true");
}

//Create a new list item for a sync pair
function createSyncRow(id, sync) {
	let fullRow = $($("#template-sync-row").html().trim()).clone().appendTo("#syncs-list");
	$(fullRow).find(".sync-header").text(sync.remote || "New Sync...");

	let row = $(fullRow).find(".collapsible-body");

	// TODO
	localCell = $("<li></li>").addClass("input-field").appendTo(row);
	localInp = $().attr("title", sync.local).appendTo(localCell);
	localInp.find(".localdirtext").val(sync.local);
	localInp.find(".btn").click(function() {
		lDirChanged = $(this).closest("#syncs-list > li").attr("data-id");
		OurCodeWorld.Filebrowser.folderPicker.single({
			success: function(data) {
				$("li[data-id=" + lDirChanged + "] .localdirtext").val(data[0]);
			},
			error: function() {}
		});
	});

	fullRow.get(0).init();

	/* autoCell = $("<li></li>").addClass("smaller").appendTo(row);
	cbox = $("<input type='checkbox' class='filled-in' />").appendTo(autoCell);
	cbox.attr("id", "acBox" + id).addClass("autoUpdate").prop("checked", sync.autoUpdate);
	$("<label></label>").attr("for", "acBox" + id).text("Auto Update").appendTo(autoCell);

	sizeCell = $("<li></li>").addClass("smaller").appendTo(row);
	cbox = $("<input type='checkbox' class='filled-in' />").appendTo(sizeCell);
	cbox.attr("id", "scBox" + id).addClass("useSize").prop("checked", sync.useSize);
	$("<label></label>").attr("for", "scBox" + id).text("Use Size").appendTo(sizeCell);

	timeCell = $("<li></li>").addClass("smaller").appendTo(row);
	cbox = $("<input type='checkbox' class='filled-in' />").appendTo(timeCell);
	cbox.attr("id", "tcBox" + id).addClass("useTime").prop("checked", sync.useTime);
	$("<label></label>").attr("for", "tcBox" + id).text("Use Time").appendTo(timeCell);

	runCell = $("<li></li>").appendTo(row);
	button = $("<button></button>").appendTo(runCell);
	button.addClass("btn waves-effect waves-light").text("Run Sync");
	button.attr("title", "This will only work if changes have been saved (button below).");
	button.click(function () {
		runSync($(this).closest("#syncs-list > li").attr("data-id"));
	});

	button = $("<button></button>").appendTo(header);
	button.addClass("btn waves-effect waves-light material-icons").text("clear");
	button.click(function () {
		$(this).closest("li").remove();
	}); */
}

//Apply changes to the syncs list
function applyChanges() {
	syncs = [];
	$("#syncs-list > li").each(function () {
		sync = {
			remote: $(this).find(".remotedir").val(),
			local: $(this).find(".localdirtext").val(),
			autoUpdate: $(this).find(".autoUpdate").prop("checked"),
			useSize: $(this).find(".useSize").prop("checked"),
			useTime: $(this).find(".useTime").prop("checked")
		};
		syncs.push(sync);
	});

	window.localStorage.setItem("sync", JSON.stringify(syncs));

	window.localStorage.setItem("saveDataOffline", $("#savemeta").prop("checked"));

	runAllSyncs();

	$("#status").text("Changes Saved.");
}

//Begin saving file listings
function applySaveMeta() {
	runSaveMeta();

	$("#status").text("Saving file listings.");
}

//Retrieve GET param on document ready
$(document).ready(function () {
	displaySyncs();
});

/* OurCodeWorld.Filebrowser.folderPicker.single({
	success:function(d){console.log(d)},
	error:function(d){console.log(d)}
}); */
//TODO implement this (success will print an array with folder path at 0)
