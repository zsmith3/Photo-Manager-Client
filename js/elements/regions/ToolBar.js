// Toolbar class
class ToolBar extends ToggleBar {
	// Refresh the toolbar
	refresh (resize) {
		let buttonList = null;
		let tbType = null;

		if (pageLoader.data.objectType == "faces") {
			buttonList = ToolBar.facesTBButtons;
			tbType = "faces";
		} else {
			buttonList = ToolBar.standardTBButtons;
			tbType = "standard";
			if (pageLoader.data.folderType.indexOf("album") !== -1) tbType = "stdalbum";
		}

		if ($(this).attr("data-type") != tbType || resize) {
			if (window.innerWidth >= 800) {
				$("#toolBar-large-container").html("");
				for (var i = 0; i < buttonList.length; i++) {
					if (tbType == "stdalbum" || buttonList[i].id != "albumRemButton") this.createButton(buttonList[i]).appendTo("#toolBar-large-container");
				}
			} else {
				let menu = $("#toolBar-menu").get(0);
				for (var i = 0; i < ToolBar.selButtons.length; i++) {
					//this.createMenuItem(ToolBar.selButtons[i]).appendTo("#toolBar-menu");
					menu.addOption(ToolBar.selButtons[i]);
				}
				menu.addDivider();
				for (i = 0; i < buttonList.length; i++) {
					if (tbType == "stdalbum" || buttonList[i].id != "albumRemButton") {
						if ("top" in buttonList[i] && "bottom" in buttonList[i]) {
							//this.createMenuItem(buttonList[i].top).appendTo("#toolBar-menu");
							//this.createMenuItem(buttonList[i].bottom).appendTo("#toolBar-menu");
							menu.addOption(buttonList[i].top);
							menu.addOption(buttonList[i].bottom);
						} else menu.addOption(buttonList[i]); //this.createMenuItem(buttonList[i]).appendTo("#toolBar-menu");
					}
				}
			}


			$(this).attr("data-type", tbType);
		}

		if (pageLoader.data.folderType.indexOf("root") === -1) $(".tool-button").attr("disabled", false);
		else $(".tool-button").attr("disabled", true);

		mdcSetupRipples(this);
	}

	// Create a toolbar button from a layout object
	createButton (layout, type) {
		if ("top" in layout && "bottom" in layout) {
			let buttonCont = $("<div class='tool-button tool-button-large tool-button-cont'></div>");
			this.createButton(layout.top, "tool-button-upper").appendTo(buttonCont);
			this.createButton(layout.bottom, "tool-button-lower").appendTo(buttonCont);

			return buttonCont;
		}

		type = type || "tool-button-large";

		let button = $("<button class='tool-button mdc-button mdc-button--raised mdc-theme--secondary-bg mdc-ripple-surface'></button>");

		button.addClass(type);
		button.attr("id", layout.id);
		button.attr("href", layout.modal);

		let _this = this;
		if (layout.action) {
			button.get(0).onclick = function () {
				if (layout.confirmText) {
					_this.confirmAction(layout.confirmText).then(function () {
						pageLoader.filesContainer.applyToSelection(layout.action, layout.undoAction);
					});
				} else {
					if (layout.modalSetup) layout.modalSetup();

					pageLoader.filesContainer.applyToSelection(layout.action, layout.undoAction);
				}
			};
		} else button.attr("onclick", layout.onclick);

		button.attr("title", layout.title);
		if (layout.modal) button.get(0).addEventListener("click", function () { $($(this).attr("href")).get(0).open(this); });

		for (var i = 0; i < layout.icon.length; i++) {
			$("<i class='material-icons'></i>").text(layout.icon[i]).appendTo(button);
		}

		if (layout.text && type == "tool-button-large") {
			$(document.createTextNode(" ")).appendTo(button);
			$("<span></span>").html(layout.text).appendTo(button);
		}

		return button;
	}

	/* // Create a toolbar menu item from a layout object
	createMenuItem (layout) {
		var item = $("<option></option>")
			.attr("id", layout.id)
			.attr("href", layout.modal)
			.attr("onclick", layout.onclick)
			.attr("title", layout.title);

		if (layout.modal) item.get(0).addEventListener("click", function () { $($(this).attr("href")).get(0).open(this); });

		for (var i = 0; i < layout.icon.length; i++) {
			$("<i class='material-icons'></i>").text(layout.icon[i]).appendTo(item);
		}

		if (layout.text) {
			$("<span></span>").text(layout.text.replace("<br />", " ")).appendTo(item);
		}

		return item;
	} */

	// Display confirmation modal for simple actions
	confirmAction (text, options, anchor) {
		options = options || [];
		$("#modal-confirm-warning").html("This operation will " + text.replace("%f", pageLoader.filesContainer.selection.length + " " + pageLoader.data.objectType));

		if (options.length == 0) $("#modal-confirm-options").html("None<br />");
		else $("#modal-confirm-options").html("");
		for (var i = 0; i < options.length; i++) {
			var checkbox = $("<mdc-checkbox label='" + options[i].text + "'></mdc-checkbox>")
				.appendTo("#modal-confirm-options")
				.get(0).onchange = function () {
					// TODO (not currently relevant)
				};

			$("<br />").appendTo("#modal-confirm-options");
		}
		$("<br /><br />").appendTo("#modal-confirm-options");

		$("#modal-confirm").get(0).open(anchor);

		return new Promise(function (resolve, reject) {
			$("#modal-confirm").get(0).onaccept = resolve;
		});
	}

	// Display modal for creating new items
	showAddModal (type, parentId, parentName, anchor) {
		let modal = $("#modal-generic-add");
		modal.attr("header", "Create new " + type);
		modal.find("#modal-generic-add-subtitle").text(type);

		modal.find("#modal-generic-add-parentid").val(parentId);
		if (parentName === null) modal.find("#modal-generic-add-parent").css("display", "none");
		else modal.find("#modal-generic-add-parent").css("display", "").val(parentName);

		modal.get(0).open(anchor);
		modal.find("#modal-generic-add-name .mdc-text-field__label").text("new " + type);

		return new Promise(function (resolve, reject) {
			modal.get(0).onaccept = function() { resolve({parent: $(this).find("#modal-generic-add-parentid").val(), name: $(this).find("#modal-generic-add-name").val()}); };
			//modal.get(0).oncancel = function() { reject({parent: $(this).find('#modal-generic-add-parentid').val(), name: $(this).find('#modal-generic-add-name').val()}); };
		});
	}
}

window.customElements.define("tool-bar", ToolBar);

ToolBar.standardTBButtons = [
	{
		top: {
			modal: "#modal-confirm",
			confirmText: "star %f",
			action: {
				callback: function (resolve, reject, file) { file.star().then(resolve).catch(reject); },
				beforeMessage: "Starring %f...",
				afterMessage: "Starred %f."
			},
			get undoAction () { return ToolBar.standardTBButtons[0].bottom.action; },
			// onclick: "toolBar.confirmAction('star %f').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { pageLoader.filesContainer.getFile(id).starred = true; }); });",
			title: "Star Selection",
			icon: ["star"],
			text: "Star file(s)"
		},
		bottom: {
			modal: "#modal-confirm",
			confirmText: "remove stars from %f",
			action: {
				callback: function (resolve, reject, file) { file.unstar().then(resolve).catch(reject); },
				beforeMessage: "Removing star(s) from %f...",
				afterMessage: "Removed star(s) from %f."
			},
			get undoAction () { return ToolBar.standardTBButtons[0].top.action; },
			// onclick: "toolBar.confirmAction('remove stars from %f').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { pageLoader.filesContainer.getFile(id).starred = false; }); });",
			title: "Remove Stars from Selection (this will only work on files starred by you)",
			icon: ["star", "clear"],
			text: "Remove Star(s)"
		}
	},
	{
		top: {
			modal: "#modal-confirm",
			confirmText: "mark %f for deletion",
			action: {
				callback: function (resolve, reject, file) { file.markDelete().then(resolve).catch(reject); },
				beforeMessage: "Marking %f for deletion...",
				afterMessage: "Marked %f for deletion."
			},
			get undoAction () { return ToolBar.standardTBButtons[1].bottom.action; },
			// onclick: "toolBar.confirmAction('mark %f for deletion').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { pageLoader.filesContainer.getFile(id).deleted = true; }); });",
			title: "Mark Selected for Deletion",
			icon: ["delete"],
			text: "Mark for deletion"
		},
		bottom: {
			modal: "#modal-confirm",
			confirmText: "remove deletion mark(s) from %f",
			action: {
				callback: function (resolve, reject, file) { file.unmarkDelete().then(resolve).catch(reject); },
				beforeMessage: "Removing deletion mark(s) from %f...",
				afterMessage: "Removed deletion mark(s) from %f."
			},
			get undoAction () { return ToolBar.standardTBButtons[1].top.action; },
			// onclick: "toolBar.confirmAction('remove deletion marks from %f').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { pageLoader.filesContainer.getFile(id).deleted = false; }); });",
			title: "Remove Deletion Marks from Selected (this will only work on files marked for deletion by you)",
			icon: ["delete", "clear"],
			text: "Remove deletion mark(s)"
		}
	},
	/* {
		top: {
			modal: "#modal-confirm",
			onclick: "toolBar.confirmAction('mark %f for keeping');",
			title: "Mark Selected for Keeping",
			icon: ["check"],
			text: "Mark for keeping"
		},
		bottom: {
			modal: "#modal-confirm",
			onclick: "toolBar.confirmAction('remove keeping marks from %f');",
			title: "Remove Keeping Marks from Selected (this will only work on files marked for keeping by you)",
			icon: ["clear"],
			text: "Remove keeping mark(s)"
		}
	},
	{
		modal: "#modal-confirm",
		onclick: "toolBar.confirmAction('mark a conflict between %f');",
		icon: ["warning"],
		text: "Mark Conflict",
		title: "Indicate that the selected images all portray the same view"
	}, */
	{
		modal: "#albumModal",
		icon: ["photo_album"],
		text: "Add to album",
		title: "Add the selection to an album"
	},
	/* {
		modal: "#tagModal",
		icon: ["local_offer"],
		text: "Tag<br />file(s)",
		title: "Add a tag to the selected files (to indicate something about their contents)"
	}, */
	{
		modal: "#modal-geotag",
		onclick: "if ($('#modal-geotag-map').get(0).initiated) $('#modal-geotag-map').get(0).postInit();",
		icon: ["pin_drop"],
		text: "Geotag file(s)",
		title: "Add a location marker to the selected files"
	},
	/* {
		modal: "#commentModal",
		icon: ["insert_comment"],
		text: "Add comment",
		title: "Add a comment to the files (usually temporary, as a message to other admins)"
	},
	{
		id: "downloadBtn",
		onclick: "downloadSel();",
		icon: ["file_download"],
		text: "Download selected",
		title: "Download the selected files (as a .zip for multiple files)"
	},
	{
		modal: "#addLinkModal",
		icon: ["insert_link"],
		text: "Sharable link",
		title: "Create a sharable link to the current page"
	},
	{
		modal: "#uploadModal",
		icon: ["file_upload"],
		text: "Upload a file",
		title: "Upload a file (NOT to the current location)"
	}, */
	{
		id: "albumRemButton",
		modal: "#modal-confirm",
		confirmText: "remove %f from the current album",
		action: {
			callback: function (resolve, reject, file) { pageLoader.data.album.removeFile(file).then(resolve).catch(reject); },
			beforeMessage: "Removing %f from the current album...",
			afterMessage: "Removed %f from the current album."
		},
		// TODO undoAction
		// onclick: "toolBar.confirmAction('remove %f from the current album', /* [{'text': 'Remove from parent albums', 'input': 'remAlbParents'}] */).then(function () { pageLoader.data.album.removeFiles(pageLoader.filesContainer.selection); });",
		title: "Remove selection from this album (this will only work on files added to the album by you)",
		icon: ["photo_album", "clear"],
		text: "Remove file(s)"
	}
];

ToolBar.facesTBButtons = [
	{
		modal: "#modal-confirm",
		confirmText: "confirm identification of %f",
		action: {
			callback: function (resolve, reject, file) { file.setStatus(1).then(resolve).catch(reject); },
			// TODO test that this works with faces
			beforeMessage: "Confirming identification of %f...",
			afterMessage: "Confirmed identification of %f."
		},
		// TODO undoAction
		// onclick: "toolBar.confirmAction('confirm identification of %f').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { Face.getById(id).setStatus(1); }); });",
		icon: ["check"],
		text: "Confirm Person",
		title: "Confirm that the selected faces have been correctly identified"
	},
	{
		modal: "#modal-people-face-set",
		icon: ["person", "edit"],
		text: "Change Person",
		title: "Set/change the identification of the selected faces"
	},
	{
		modal: "#modal-confirm",
		confirmText: "ignore %f (this indicates that the selected faces are certainly of random strangers)",
		action: {
			callback: function (resolve, reject, file) { file.setStatus(4).then(resolve).catch(reject); },
			beforeMessage: "Ignoring %f...",
			afterMessage: "Ignored %f."
		},
		// TODO undoAction
		// onclick: "toolBar.confirmAction('ignore %f (this indicates that the selected faces are certainly of random strangers)').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { Face.getById(id).setStatus(4); }); });",
		icon: ["face", "clear"],
		text: "Ignore Face(s)",
		title: "Mark the selected faces as certainly belonging to random strangers"
	},
	{
		modal: "#modal-confirm",
		confirmText: "remove %f (this indicates that the selected images are not in fact human faces)",
		action: {
			callback: function (resolve, reject, file) { file.setStatus(5).then(resolve).catch(reject); },
			beforeMessage: "Removing %f...",
			afterMessage: "Removed %f."
		},
		// TODO undoAction
		// onclick: "toolBar.confirmAction('remove %f (this indicates that the selected images are not in fact human faces)').then(function () { pageLoader.filesContainer.selection.forEach(function (id) { Face.getById(id).setStatus(5); }); });",
		icon: ["person_outline", "clear"],
		text: "Remove Face(s)",
		title: "Mark the selected faces as non-human objects"
	},
];

ToolBar.selButtons = [
	{
		onclick: "pageLoader.filesContainer.selectAll(true);",
		icon: ["select_all"],
		text: "Select All",
		title: "Select all items on the current page"
	},
	{
		onclick: "pageLoader.filesContainer.selectAll(false);",
		icon: ["clear"],
		text: "Select None",
		title: "Clear the current selection"
	},
	{
		onclick: "pageLoader.filesContainer.invertSelection();",
		icon: ["invert_colors"],
		text: "Invert Selection",
		title: "Invert which files are selected"
	}
];
